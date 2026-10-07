import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Experience connected read-only list and form review", { skip: process.env.RUN_CONNECTED_ADMIN_EXPERIENCE_REVIEW !== "1" }, async () => {
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
  let legacyLogoReviewed = false;
  let legacyLogoOmitted = false;
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
      if (path === "/api/admin/experience" && ["POST", "PUT", "DELETE"].includes(method)) {
        mockedWrites++;
        if (legacyLogoReviewed && method === "PUT") legacyLogoOmitted = !Object.hasOwn(JSON.parse(route.request().postData() || "{}"), "logo_url");
        return route.fulfill({ status: 503, json: { error: "Review save unavailable" } });
      }
      blockedWrites++;
      return route.abort();
    });
    stage = "list";
    const list = await context.newPage();
    const response = await list.goto("http://localhost:3000/admin/experience", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await list.getByRole("heading", { name: "Experience", exact: true }).waitFor();
    await list.getByRole("status").filter({ hasText: /Showing .*entries/ }).waitFor();
    assert.equal(await list.getByRole("alert").filter({ hasText: "entries could not be loaded" }).count(), 0);
    const deleteButton = list.getByRole("button", { name: /^Delete experience entry:/ }).first();
    if (await deleteButton.count()) {
      await deleteButton.click();
      const dialog = list.getByRole("dialog", { name: "Permanently delete experience entry?" });
      await dialog.waitFor();
      assert.equal(await dialog.getByRole("textbox").count(), 0);
      assert.equal(await dialog.getByRole("button", { name: "Delete permanently" }).isDisabled(), false);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      assert.equal(mockedWrites, 0);
      const editHref = await list.getByRole("link", { name: /^Edit experience entry:/ }).first().getAttribute("href");
      const edit = await context.newPage();
      const editResponse = await edit.goto(`http://localhost:3000${editHref}`, { waitUntil: "domcontentloaded" });
      assert.equal(editResponse?.status(), 200);
      await edit.getByRole("heading", { name: "Edit Experience Entry" }).waitFor();
      editReviewed = true;
    }
    stage = "new";
    const form = await context.newPage();
    const created = await form.goto("http://localhost:3000/admin/experience/new", { waitUntil: "domcontentloaded" });
    assert.equal(created?.status(), 200);
    await form.getByRole("heading", { name: "Create New Experience Entry" }).waitFor();
    await form.getByRole("button", { name: "Save Experience" }).click();
    await form.locator("#experience-role-error").waitFor();
    await form.locator("#experience-start-year-error").waitFor();
    assert.equal(mockedWrites, 0);
    await form.getByRole("textbox", { name: "Job title *" }).fill("Review-only role");
    await form.getByRole("textbox", { name: "Organization *" }).fill("Review-only organization");
    await form.getByRole("textbox", { name: "Start year *" }).fill("2026");
    await form.getByRole("spinbutton", { name: "Display Order" }).fill("");
    await form.getByRole("button", { name: "Save Experience" }).click();
    await form.locator("#experience-order-error").waitFor();
    assert.equal(mockedWrites, 0);
    await form.getByRole("spinbutton", { name: "Display Order" }).fill("0");
    await form.getByRole("button", { name: "Save Experience" }).click();
    const publish = form.getByRole("dialog", { name: "Publish experience entry?" });
    await publish.waitFor();
    await publish.getByRole("button", { name: "Cancel" }).click();
    assert.equal(mockedWrites, 0);
    await form.locator("#experience-status").click();
    await form.getByRole("option", { name: /^Draft/ }).click();
    await form.getByRole("button", { name: "Save Experience" }).click();
    await form.getByRole("alert").filter({ hasText: "Review save unavailable" }).waitFor();
    assert.equal(mockedWrites, 1);
    await form.getByRole("button", { name: "Cancel", exact: true }).click();
    const discard = form.getByRole("dialog", { name: "Discard unsaved Experience changes?" });
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
    stage = "legacy-logo";
    const editHrefs = await list.locator('a[href^="/admin/experience/"][aria-label^="Edit experience entry:"]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))]);
    for (const editHref of editHrefs) {
      const probe = await context.newPage();
      await probe.goto(`http://localhost:3000${editHref}`, { waitUntil: "domcontentloaded" });
      await probe.getByRole("heading", { name: "Edit Experience Entry" }).waitFor();
      const logo = await probe.locator("#experience-logo-url").inputValue();
      if (logo && !logo.startsWith("https://") && !(logo.startsWith("/") && !logo.startsWith("//") && !logo.split("/").includes(".."))) {
        legacyLogoReviewed = true;
        await probe.getByRole("textbox", { name: "Location", exact: true }).fill("Review-only location");
        await probe.getByRole("button", { name: "Save Experience" }).click();
        await probe.getByRole("alert").filter({ hasText: "Review save unavailable" }).waitFor({ timeout: 5000 }).catch(async () => {
          const fields = await probe.locator('[id^="experience-"][id$="-error"]').evaluateAll((elements) => elements.map((element) => element.id));
          const labels = await probe.locator('form [role="alert"]').evaluateAll((elements) => elements.map((element) => {
            const text = element.textContent || "";
            if (text.includes("HTTPS URL")) return "logo";
            if (text.includes("highlights")) return "highlights";
            if (text.includes("year")) return "year";
            const label = element.closest("div.space-y-2")?.querySelector("label")?.textContent?.trim();
            return ["Job title *", "Organization *", "Start year *", "End year (optional)", "Display Order", "Highlights (one per line)", "Organization logo URL (optional)"].includes(label) ? label : "other";
          }));
          failures.push(`legacy-form-validation-${fields.join(",")}-${labels.join(",")}`);
        });
        if (!legacyLogoOmitted) failures.push("unchanged-legacy-logo-was-overwritten");
        break;
      }
      await probe.close();
    }
    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin Experience review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, editReviewed, legacyLogoReviewed, legacyLogoOmitted, pageErrors, blockedWrites, mockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
