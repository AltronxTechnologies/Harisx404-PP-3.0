import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin dropdown options are accessible and contained on narrow screens", { skip: process.env.RUN_CONNECTED_ADMIN_MENUS_REVIEW !== "1" }, async () => {
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
  let blockedWrites = 0;
  let pageErrors = 0;
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
    context = await browser.newContext({ viewport: { width: 320, height: 640 } });
    await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: "http://localhost:3000" })));
    context.on("page", (page) => page.on("pageerror", () => { pageErrors++; }));
    await context.route("**/*", (route) => {
      if (["GET", "HEAD", "OPTIONS"].includes(route.request().method())) return route.continue();
      if (new URL(route.request().url()).pathname === "/__nextjs_original-stack-frames") return route.continue();
      blockedWrites++;
      return route.abort();
    });
    const page = await context.newPage();
    const checkOptions = async (label) => {
      const metrics = await page.getByRole("listbox").evaluate((menu) => ({
        left: menu.getBoundingClientRect().left,
        right: menu.getBoundingClientRect().right,
        height: menu.getBoundingClientRect().height,
        short: [...menu.querySelectorAll('[role="option"]')].filter((option) => option.getBoundingClientRect().height < 44).length,
      }));
      if (metrics.left < -1 || metrics.right > 321 || metrics.height > 545 || metrics.short) failures.push(`${label}:${JSON.stringify(metrics)}`);
    };

    stage = "blog-filter";
    await page.goto("http://localhost:3000/admin/blogs", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Blog Posts", exact: true }).waitFor();
    await page.getByRole("button", { name: /All statuses/ }).click();
    await checkOptions("blog-filter");
    await page.keyboard.press("Escape");
    stage = "blog-editor-actions";
    await page.goto("http://localhost:3000/admin/blogs/new", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "AI Assist" }).first().waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "AI Assist" }).first().click();
    const aiMenu = await page.locator("#editor-ai-actions").evaluate((element) => ({
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
      short: [...element.querySelectorAll("button")].filter((button) => button.getBoundingClientRect().height < 44).length,
    }));
    if (aiMenu.left < -1 || aiMenu.right > 321 || aiMenu.short) failures.push(`blog-ai:${JSON.stringify(aiMenu)}`);

    stage = "project-filter";
    await page.goto("http://localhost:3000/admin/projects", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Projects", exact: true }).waitFor();
    await page.locator("#project-list-status").click();
    await checkOptions("project-filter");
    await page.getByRole("option", { name: "Draft" }).click();
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/status=draft/, { waitUntil: "commit" });

    stage = "project";
    await page.goto("http://localhost:3000/admin/projects/new", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Create New Project" }).waitFor();
    await page.locator("#project-stage").click();
    await checkOptions("project-stage");
    await page.getByRole("option", { name: "Testing" }).click();
    assert.match(await page.locator("#project-stage").textContent(), /Testing/);
    await page.locator("#project-status").click();
    await checkOptions("project-status");
    await page.getByRole("option", { name: /^Published/ }).click();
    assert.match(await page.locator("#project-status").textContent(), /Published/);

    stage = "experience";
    await page.goto("http://localhost:3000/admin/experience/new", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Create New Experience Entry" }).waitFor();
    await page.locator("#experience-employment-type").click();
    await checkOptions("employment-type");
    await page.getByRole("option", { name: "Internship" }).click();
    await page.locator("#experience-start-month").click();
    await checkOptions("start-month");
    await page.getByRole("option", { name: "January" }).click();
    await page.locator("#experience-start-month").focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("option", { name: "January" }).waitFor();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.match(await page.locator("#experience-start-month").textContent(), /February/);
    await page.getByRole("checkbox", { name: "I currently work here" }).check();
    assert.equal(await page.locator("#experience-end-month").isDisabled(), true);

    stage = "certification";
    await page.goto("http://localhost:3000/admin/certifications/new", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Create New Certification" }).waitFor();
    await page.locator("#certification-category").click();
    await checkOptions("category");
    await page.getByRole("option", { name: "Cybersecurity" }).click();
    assert.match(await page.locator("#certification-category").textContent(), /Cybersecurity/);

    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin menus review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, pageErrors, blockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
