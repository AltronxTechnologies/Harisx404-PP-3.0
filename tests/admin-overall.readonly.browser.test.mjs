import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Settings and Testimonials validation and navigation review", { skip: process.env.RUN_CONNECTED_ADMIN_OVERALL_REVIEW !== "1" }, async () => {
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
  let mockSettingsSuccess = false;
  let submittedUnusedKeywords = false;
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
      if (path === "/api/admin/settings" && method === "PUT") {
        mockedWrites++;
        submittedUnusedKeywords ||= Object.hasOwn(JSON.parse(route.request().postData() || "{}"), "seo_keywords");
        if (mockSettingsSuccess) return route.fulfill({ status: 200, json: { success: true } });
        return route.fulfill({ status: 400, json: { error: "Review settings unavailable", fields: { seo_description: ["Review field feedback"] } } });
      }
      if (path === "/api/admin/testimonials" && method === "POST") {
        mockedWrites++;
        return route.fulfill({ status: 503, json: { error: "Review save unavailable" } });
      }
      blockedWrites++;
      return route.abort();
    });

    stage = "settings";
    const settings = await context.newPage();
    assert.equal((await settings.goto("http://localhost:3000/admin/settings", { waitUntil: "domcontentloaded" }))?.status(), 200);
    await settings.getByRole("heading", { name: "Global Site Settings" }).waitFor();
    stage = "settings-ready";
    const siteName = settings.getByRole("textbox", { name: "Site Name" });
    const originalName = await siteName.inputValue();
    const github = settings.getByRole("textbox", { name: "GitHub URL" });
    const originalGithub = await github.inputValue();
    await siteName.fill(" ");
    await github.fill("http://example.invalid/profile");
    await settings.getByRole("button", { name: "Save Settings" }).click();
    stage = "settings-invalid-submit";
    await settings.locator("#site_name-error").waitFor();
    stage = "settings-name-error";
    await settings.locator("#github_url-error").waitFor();
    stage = "settings-url-error";
    assert.equal(mockedWrites + blockedWrites, 0, "Invalid Settings attempted a write");
    await siteName.fill(originalName);
    await github.fill(originalGithub);
    await settings.getByRole("textbox", { name: /SEO Description/ }).fill("Review-only unsaved description");
    await settings.getByText(/31\/500 characters/).waitFor();
    await settings.getByRole("button", { name: "Save Settings" }).click();
    await settings.locator("#seo_description-error").filter({ hasText: "Review field feedback" }).waitFor();
    assert.equal(mockedWrites, 1, "Settings field response not mapped");
    await settings.locator('a[href="/admin"]:visible').first().click();
    stage = "settings-sidebar";
    const settingsDialog = settings.getByRole("dialog", { name: "Discard unsaved settings?" });
    await settingsDialog.waitFor();
    await settingsDialog.getByRole("button", { name: "Cancel" }).click();
    assert.equal(new URL(settings.url()).pathname, "/admin/settings");
    await settings.locator('button:has-text("Sign Out"):visible').first().click();
    stage = "settings-signout";
    await settingsDialog.waitFor();
    await settingsDialog.getByRole("button", { name: "Cancel" }).click();

    stage = "settings-discard";
    await settings.getByRole("button", { name: "Discard changes" }).click();
    assert.equal(await settings.getByRole("button", { name: "Save Settings" }).isDisabled(), true);
    assert.equal(await settings.getByRole("textbox", { name: /SEO Description/ }).inputValue() === "Review-only unsaved description", false);
    stage = "settings-mocked-save";
    mockSettingsSuccess = true;
    await settings.getByRole("textbox", { name: /SEO Description/ }).fill("Review-only unsaved description");
    await settings.getByRole("button", { name: "Save Settings" }).click();
    await settings.getByRole("status").filter({ hasText: "Settings saved." }).waitFor();
    assert.equal(await settings.getByRole("button", { name: "Save Settings" }).isDisabled(), true);
    assert.equal(submittedUnusedKeywords, false, "Unused keyword field was overwritten");
    assert.equal(mockedWrites, 2);

    stage = "testimonial";
    const form = await context.newPage();
    assert.equal((await form.goto("http://localhost:3000/admin/testimonials/new", { waitUntil: "domcontentloaded" }))?.status(), 200);
    await form.getByRole("heading", { name: "Create New Testimonial" }).waitFor();
    await form.getByRole("textbox", { name: "Headline" }).fill("   ");
    await form.getByRole("textbox", { name: "Quote" }).fill("   ");
    await form.getByRole("textbox", { name: "Name" }).fill("   ");
    await form.getByRole("spinbutton", { name: "Display Order" }).fill("");
    await form.getByRole("button", { name: "Save Testimonial" }).click();
    await form.locator("#testimonial-headline-error").waitFor();
    await form.locator("#testimonial-display_order-error").waitFor();
    assert.equal(mockedWrites + blockedWrites, 2, "Invalid Testimonial attempted a write");
    await form.getByRole("textbox", { name: "Headline" }).fill("Review only headline");
    await form.getByRole("textbox", { name: "Quote" }).fill("Review only testimonial quote.");
    await form.getByRole("textbox", { name: "Name" }).fill("Review visitor");
    await form.getByRole("spinbutton", { name: "Display Order" }).fill("0");
    await form.locator("#testimonial-status").click();
    await form.getByRole("option", { name: /^Published/ }).click();
    await form.getByRole("button", { name: "Save Testimonial" }).click();
    const publish = form.getByRole("dialog", { name: "Publish testimonial?" });
    await publish.waitFor();
    await publish.getByRole("button", { name: "Cancel" }).click();
    assert.equal(mockedWrites, 2);
    await form.locator("#testimonial-status").click();
    await form.getByRole("option", { name: /^Draft/ }).click();
    await form.getByRole("button", { name: "Save Testimonial" }).click();
    await form.getByRole("alert").filter({ hasText: "Review save unavailable" }).waitFor();
    assert.equal(mockedWrites, 3);
    await form.locator('a[href="/admin"]:visible').first().click();
    const discard = form.getByRole("dialog", { name: "Discard unsaved testimonial changes?" });
    await discard.waitFor();
    await discard.getByRole("button", { name: "Cancel" }).click();

    stage = "geometry";
    for (const [page, surface] of [[settings, "settings"], [form, "testimonial"]]) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        const metrics = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('.admin-content button, .admin-content input:not([type="hidden"]):not([type="checkbox"]), .admin-content textarea')].filter((element) => element.getBoundingClientRect().height > 0);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, short: controls.filter((element) => element.getBoundingClientRect().height < 44 || element.getBoundingClientRect().width < 44).length, outside: controls.filter((element) => element.getBoundingClientRect().right > innerWidth + 1).length };
        });
        if (metrics.overflow || metrics.short || metrics.outside) failures.push(`${surface}-${width}:${JSON.stringify(metrics)}`);
        if (surface === "settings" && process.env.RUN_REDACTED_SETTINGS_SCREENSHOT === "1" && (width === 320 || width === 1440)) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: `/tmp/opencode/admin-settings-${width}-redacted.png`, maskColor: "#303036", mask: [page.locator(".admin-content input"), page.locator(".admin-content textarea")] });
        }
      }
    }
    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin-wide review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, pageErrors, blockedWrites, mockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
