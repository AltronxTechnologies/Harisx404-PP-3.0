import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Certifications connected read-only list and form review", { skip: process.env.RUN_CONNECTED_ADMIN_CERTIFICATIONS_REVIEW !== "1" }, async () => {
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
  let mockedWrites = 0;
  let editReviewed = false;
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
      const method = route.request().method();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
      const path = new URL(route.request().url()).pathname;
      if (path === "/__nextjs_original-stack-frames") return route.continue();
      if (path === "/api/admin/certifications" && ["POST", "PUT", "DELETE"].includes(method)) {
        mockedWrites++;
        return route.fulfill({ status: 503, json: { error: "Review save unavailable" } });
      }
      blockedWrites++;
      return route.abort();
    });

    stage = "list";
    const list = await context.newPage();
    const response = await list.goto("http://localhost:3000/admin/certifications", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await list.getByRole("heading", { name: "Certifications", exact: true }).waitFor();
    await list.getByRole("status").filter({ hasText: /Showing .*credentials/ }).waitFor();
    assert.equal(await list.getByRole("alert").filter({ hasText: "Certifications could not be loaded" }).count(), 0);
    const deleteButton = list.getByRole("button", { name: /^Delete certification:/ }).first();
    if (await deleteButton.count()) {
      await deleteButton.click();
      const dialog = list.getByRole("dialog", { name: "Permanently delete certification?" });
      await dialog.waitFor();
      assert.equal(await dialog.getByRole("textbox").count(), 0);
      assert.equal(await dialog.getByRole("button", { name: "Delete permanently" }).isDisabled(), false);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      assert.equal(mockedWrites, 0);
      const editHref = await list.getByRole("link", { name: /^Edit / }).first().getAttribute("href");
      const edit = await context.newPage();
      const editResponse = await edit.goto(`http://localhost:3000${editHref}`, { waitUntil: "domcontentloaded" });
      assert.equal(editResponse?.status(), 200);
      await edit.getByRole("heading", { name: "Edit Certification" }).waitFor();
      editReviewed = true;
    }
    stage = "new";
    const form = await context.newPage();
    const created = await form.goto("http://localhost:3000/admin/certifications/new", { waitUntil: "domcontentloaded" });
    assert.equal(created?.status(), 200);
    await form.getByRole("heading", { name: "Create New Certification" }).waitFor();
    await form.getByRole("button", { name: "Create credential" }).click();
    await form.getByRole("alert").filter({ hasText: "Title is required" }).waitFor();
    assert.equal(mockedWrites, 0);
    await form.getByRole("textbox", { name: "Credential title" }).fill("Review-only credential");
    await form.getByRole("textbox", { name: "Issuing organization" }).fill("Review-only issuer");
    await form.getByRole("spinbutton", { name: "Display order" }).fill("");
    await form.getByRole("button", { name: "Create credential" }).click();
    await form.getByRole("alert").filter({ hasText: "Enter a display order" }).waitFor();
    assert.equal(mockedWrites, 0);
    await form.getByRole("spinbutton", { name: "Display order" }).fill("0");
    await form.getByRole("button", { name: "Create credential" }).click();
    const publish = form.getByRole("dialog", { name: "Publish certification?" });
    await publish.waitFor();
    await publish.getByRole("button", { name: "Cancel" }).click();
    assert.equal(mockedWrites, 0);
    await form.locator("#certification-status").click();
    await form.getByRole("option", { name: /^Draft/ }).click();
    await form.locator("#certification-category").click();
    await form.getByRole("option", { name: "Cybersecurity" }).click();
    await form.getByRole("button", { name: "Create credential" }).click();
    await form.getByRole("alert").filter({ hasText: "Review save unavailable" }).waitFor();
    assert.equal(mockedWrites, 1);
    await form.getByRole("button", { name: "Cancel", exact: true }).click();
    const discard = form.getByRole("dialog", { name: "Discard unsaved certification changes?" });
    await discard.waitFor();
    await discard.getByRole("button", { name: "Cancel" }).click();

    stage = "geometry";
    for (const [page, surface] of [[list, "list"], [form, "new"]]) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        const measures = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('.admin-content button, .admin-content input:not([type="hidden"]):not([type="checkbox"]), .admin-content textarea, .admin-content select')].filter((element) => element.getBoundingClientRect().height > 0);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, short: controls.filter((element) => element.getBoundingClientRect().height < 44 || element.getBoundingClientRect().width < 44).length, outOfBounds: controls.filter((element) => element.getBoundingClientRect().right > innerWidth + 1).length };
        });
        if (measures.overflow || measures.short || measures.outOfBounds) failures.push(`${surface}-${width}:${JSON.stringify(measures)}`);
      }
    }
    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin Certifications review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, editReviewed, pageErrors, blockedWrites, mockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
