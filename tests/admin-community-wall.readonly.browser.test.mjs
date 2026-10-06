import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Community Wall read-only moderation review", { skip: process.env.RUN_CONNECTED_ADMIN_COMMUNITY_REVIEW !== "1" }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !anon || !service || !email) throw new Error("Connected review unavailable");
  const browser = await chromium.launch({ headless: true });
  const cookies = new Map();
  let client;
  let context;
  let pageErrors = 0;
  let mockedWrites = 0;
  let blockedWrites = 0;
  let reviewedNote = false;
  let sessionRevoked = false;
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
      const method = route.request().method();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
      const path = new URL(route.request().url()).pathname;
      if (path === "/__nextjs_original-stack-frames") return route.continue();
      if (path === "/api/admin/community-wall" && ["PATCH", "DELETE"].includes(method)) {
        mockedWrites++;
        return route.fulfill({ status: 409, json: { error: "This note changed or was removed. Refresh the page before moderating it." } });
      }
      blockedWrites++;
      return route.abort();
    });

    const page = await context.newPage();
    const response = await page.goto("http://localhost:3000/admin/community-wall", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, "Admin Community Wall unavailable");
    await page.getByRole("heading", { name: "Community Wall", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Pending review" }).waitFor();
    await page.getByRole("heading", { name: "Reviewed notes" }).waitFor();
    assert.equal(await page.getByRole("alert").filter({ hasText: "notes could not be loaded" }).count(), 0);

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const measures = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll(".admin-content button")].filter((button) => button.getBoundingClientRect().height > 0);
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          dark: Boolean(document.querySelector("[data-admin-root].dark")),
          short: buttons.filter((button) => button.getBoundingClientRect().height < 44 || button.getBoundingClientRect().width < 44).length,
          outOfBounds: buttons.filter((button) => button.getBoundingClientRect().right > innerWidth + 1).length,
        };
      });
      if (measures.overflow || !measures.dark || measures.short || measures.outOfBounds) failures.push(`layout-${width}`);
    }

    const deleteButton = page.getByRole("button", { name: /^Delete .*Community Wall note$/ }).first();
    if (await deleteButton.count()) {
      reviewedNote = true;
      await deleteButton.click();
      const dialog = page.getByRole("dialog", { name: "Permanently delete Community Wall note?" });
      await dialog.waitFor();
      assert.equal(await dialog.getByRole("textbox").count(), 0);
      assert.equal(await dialog.getByRole("button", { name: "Delete permanently" }).isDisabled(), false);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      assert.equal(mockedWrites, 0, "Cancel attempted a mutation");
      const archive = page.getByRole("button", { name: "Archive", exact: true }).first();
      const publish = page.getByRole("button", { name: "Publish", exact: true }).first();
      if (await archive.count()) await archive.click();
      else await publish.click();
      const confirmation = page.getByRole("dialog");
      await confirmation.waitFor();
      await confirmation.getByRole("button", { name: /^(Archive note|Publish note)$/ }).click();
      await page.getByRole("alert").filter({ hasText: "This note changed or was removed" }).waitFor();
      assert.equal(mockedWrites, 1, "Conflict check did not mock exactly one write");
    }
    assert.equal(pageErrors, 0, "Browser runtime errors");
    assert.equal(blockedWrites, 0, "Unexpected write attempted");
    assert.deepEqual(failures, [], "Responsive layout review failed");
  } catch {
    throw new Error("Admin Community Wall review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try {
        const { error } = await client.auth.signOut({ scope: "local" });
        sessionRevoked = !error;
      } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ reviewedNote, pageErrors, mockedWrites, blockedWrites, liveWrites: 0, failures, sessionRevoked }));
    if (client && !sessionRevoked) throw new Error("Review session could not be locally revoked");
  }
});
