import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Logs browses connected events without writes", { skip: process.env.RUN_CONNECTED_ADMIN_LOGS_REVIEW !== "1" }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !anon || !service || !email) throw new Error("Connected review unavailable");
  const browser = await chromium.launch({ headless: true });
  const cookies = new Map();
  let client;
  let context;
  let revoked = false;
  let pageErrors = 0;
  let blockedWrites = 0;
  let stage = "auth";
  try {
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: users, error: lookupError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (lookupError || !users.users.some((user) => user.email?.toLowerCase() === email)) throw new Error("Owner identity unavailable");
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) throw new Error("Review session unavailable");
    client = createServerClient(url, anon, {
      cookies: {
        getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
        setAll: (updates) => updates.forEach(({ name, value }) => cookies.set(name, value)),
      },
    });
    const { data: session, error: authError } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
    if (authError || session.user?.email?.toLowerCase() !== email) throw new Error("Owner identity mismatch");
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: "http://localhost:3000" })));
    context.on("page", (page) => page.on("pageerror", () => { pageErrors++; }));
    await context.route("**/*", (route) => {
      const request = route.request();
      if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return route.continue();
      const path = new URL(request.url()).pathname;
      if (path === "/admin/logs" && request.method() === "POST" && request.headers()["next-action"]) return route.continue();
      if (path === "/__nextjs_original-stack-frames") return route.continue();
      blockedWrites++;
      return route.abort();
    });
    const page = await context.newPage();
    stage = "load";
    assert.equal((await page.goto("http://localhost:3000/admin/logs", { waitUntil: "domcontentloaded" }))?.status(), 200);
    stage = "heading";
    await page.getByRole("heading", { name: "System Logs" }).waitFor();
    stage = "count";
    await page.getByRole("status").filter({ hasText: /Showing 1-50 of/ }).waitFor();
    stage = "alerts";
    assert.equal(await page.getByRole("alert").filter({ hasText: /Logs or counts could not be loaded|Logs could not be loaded/ }).count(), 0);
    stage = "responsive";
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}`);
      assert.equal(await page.locator("main button:visible").evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().right > innerWidth + 1).length), 0, `Out-of-view action at ${width}`);
      if (process.env.RUN_REDACTED_LOGS_SCREENSHOT === "1" && (width === 320 || width === 1440)) {
        await page.screenshot({ path: `/tmp/opencode/admin-logs-${width}-redacted.png`, maskColor: "#303036", mask: [page.locator(".divide-y > div")] });
      }
    }
    stage = "details";
    await page.getByRole("button", { name: "View details" }).first().click();
    await page.getByText("Recorded details").first().waitFor();
    stage = "pagination";
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("status").filter({ hasText: /Showing 51-100 of/ }).waitFor();
    stage = "filters";
    await page.getByRole("combobox", { name: "Status" }).selectOption("resolved");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.getByRole("status").filter({ hasText: /matching events \(filtered\)/ }).waitFor();
    assert.equal(await page.getByRole("alert").filter({ hasText: /Logs or counts could not be loaded|Logs could not be loaded/ }).count(), 0);
    stage = "search";
    await page.getByRole("searchbox", { name: "Search message" }).fill("unlikely-review-search-sentinel-94719");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.getByRole("heading", { name: "No matching events" }).waitFor();
    assert.equal(blockedWrites, 0);
    assert.equal(pageErrors, 0);
  } catch {
    throw new Error("Admin Logs review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, pageErrors, blockedWrites, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
