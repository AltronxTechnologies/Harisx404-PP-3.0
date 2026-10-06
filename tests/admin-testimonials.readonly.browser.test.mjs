import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Testimonials read-only list and form review", { skip: process.env.RUN_CONNECTED_ADMIN_TESTIMONIALS_REVIEW !== "1" }, async () => {
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
  let reviewedPending = false;
  const failures = [];
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
      if (["GET", "HEAD", "OPTIONS"].includes(route.request().method())) return route.continue();
      if (new URL(route.request().url()).pathname === "/__nextjs_original-stack-frames") return route.continue();
      blockedWrites++;
      return route.abort();
    });
    const list = await context.newPage();
    const response = await list.goto("http://localhost:3000/admin/testimonials", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await list.getByRole("heading", { name: "Testimonials", exact: true }).waitFor();
    await list.getByRole("heading", { name: "Pending review" }).waitFor();
    if (await list.getByRole("button", { name: "Approve" }).count()) {
      reviewedPending = true;
      await list.getByRole("button", { name: "Approve" }).first().click();
      const dialog = list.getByRole("dialog", { name: "Publish testimonial?" });
      await dialog.waitFor();
      await dialog.getByRole("button", { name: "Cancel" }).click();
      assert.equal(blockedWrites, 0);
    }
    const form = await context.newPage();
    const newResponse = await form.goto("http://localhost:3000/admin/testimonials/new", { waitUntil: "domcontentloaded" });
    assert.equal(newResponse?.status(), 200);
    await form.getByRole("heading", { name: "Create New Testimonial" }).waitFor();

    for (const [page, surface] of [[list, "list"], [form, "new"]]) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        const measures = await page.evaluate(() => {
          const controls = [...document.querySelectorAll(".admin-content button, .admin-content input:not([type=hidden]), .admin-content textarea, .admin-content select")].filter((element) => element.getBoundingClientRect().height > 0);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            short: controls.filter((element) => element.getBoundingClientRect().height < 44 || element.getBoundingClientRect().width < 44).length,
            outOfBounds: controls.filter((element) => element.getBoundingClientRect().right > innerWidth + 1).length,
          };
        });
        if (measures.overflow || measures.short || measures.outOfBounds) failures.push(`${surface}-${width}:${JSON.stringify(measures)}`);
      }
    }
    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin Testimonials review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try {
        const { error } = await client.auth.signOut({ scope: "local" });
        revoked = !error;
      } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ reviewedPending, pageErrors, blockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
