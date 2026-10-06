import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin FAQs connected read-only layout and controls", { skip: process.env.RUN_CONNECTED_ADMIN_FAQS_REVIEW !== "1" }, async () => {
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
  let rowReviewed = false;
  let stage = "auth";
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
    stage = "list";
    const response = await list.goto("http://localhost:3000/admin/faqs", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await list.getByRole("heading", { name: "FAQs", exact: true }).waitFor();
    stage = "list-heading";
    await list.getByRole("status").filter({ hasText: /questions/ }).waitFor();
    stage = "list-data";
    assert.equal(await list.getByRole("alert").filter({ hasText: /FAQs could not be loaded|FAQ section visibility could not be loaded/ }).count(), 0, "FAQ or settings read failed");
    const showSection = list.getByRole("switch", { name: "Show FAQ section on homepage" });
    assert.equal(await showSection.count(), 1);
    stage = "section-dialog";
    await showSection.click();
    const sectionDialog = list.getByRole("dialog");
    await sectionDialog.waitFor();
    await sectionDialog.getByRole("button", { name: "Cancel" }).click();
    assert.equal(blockedWrites, 0, "Cancelling FAQ section change attempted a write");
    const visibility = list.getByRole("button", { name: /^(Show|Hide) FAQ:/ }).first();
    stage = "row-dialog";
    if (await visibility.count()) {
      rowReviewed = true;
      await visibility.click();
      const rowDialog = list.getByRole("dialog");
      await rowDialog.waitFor();
      await rowDialog.getByRole("button", { name: "Cancel" }).click();
      assert.equal(blockedWrites, 0, "Cancelling row visibility attempted a write");
    }
    const form = await context.newPage();
    stage = "new";
    const created = await form.goto("http://localhost:3000/admin/faqs/new", { waitUntil: "domcontentloaded" });
    assert.equal(created?.status(), 200);
    await form.getByRole("heading", { name: "Create New FAQ" }).waitFor();
    await form.getByRole("button", { name: "Create FAQ" }).click();
    await form.locator("#faq-question-error").waitFor();
    assert.equal(blockedWrites, 0, "Invalid FAQ form attempted a write");
    await form.getByRole("textbox", { name: "Question" }).fill("Review-only FAQ question?");
    await form.getByRole("textbox", { name: "Answer" }).fill("Review-only FAQ answer.");
    await form.getByRole("spinbutton", { name: "Display order" }).fill("");
    await form.getByRole("button", { name: "Create FAQ" }).click();
    await form.locator("#faq-order-error").waitFor();
    assert.equal(blockedWrites, 0, "Blank order attempted a write");
    await form.getByRole("button", { name: "Cancel", exact: true }).click();
    const discard = form.getByRole("dialog", { name: "Discard unsaved FAQ changes?" });
    await discard.waitFor();
    await discard.getByRole("button", { name: "Cancel" }).click();

    for (const [page, surface] of [[list, "list"], [form, "new"]]) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        const measures = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('.admin-content button, .admin-content input:not([type="hidden"]):not([type="checkbox"]), .admin-content textarea')].filter((element) => element.getBoundingClientRect().height > 0);
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
    throw new Error("Admin FAQ review failed; see safe metrics");
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
    console.log(JSON.stringify({ stage, rowReviewed, pageErrors, blockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
