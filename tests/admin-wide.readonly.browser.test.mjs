import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

const routes = [
  "/admin", "/admin/analytics", "/admin/blogs", "/admin/blogs/new",
  "/admin/projects", "/admin/projects/new", "/admin/buildlog", "/admin/buildlog/new",
  "/admin/community-wall", "/admin/testimonials", "/admin/testimonials/new",
  "/admin/faqs", "/admin/faqs/new", "/admin/experience", "/admin/experience/new",
  "/admin/certifications", "/admin/certifications/new", "/admin/media",
  "/admin/resume", "/admin/settings", "/admin/logs",
];
const paths = process.env.ADMIN_WIDE_PATHS ? routes.filter((path) => process.env.ADMIN_WIDE_PATHS.split(",").includes(path)) : routes;

test("Admin routes keep inputs and actions reachable on phone, tablet, and desktop", { skip: process.env.RUN_CONNECTED_ADMIN_WIDE_REVIEW !== "1" }, async () => {
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
    const page = await context.newPage();
    for (const path of paths) {
      stage = path;
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded" });
        if (response?.status() !== 200) { failures.push(`${path}-${width}-status-${response?.status()}`); continue; }
        await page.locator(".admin-content h1").first().waitFor({ timeout: 15000 });
        await page.waitForTimeout(250);
        const state = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('.admin-content button, .admin-content input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .admin-content textarea, .admin-content select')]
            .filter((element) => element.getBoundingClientRect().height > 0 && !element.closest('[role="region"][tabindex="0"]'));
          const short = controls.filter((element) => element.getBoundingClientRect().height < 44 || element.getBoundingClientRect().width < 44);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            outOfBounds: controls.filter((element) => element.getBoundingClientRect().right > innerWidth + 1).length,
            short: short.slice(0, 12).map((element) => ({ tag: element.tagName, id: element.id || null, parent: element.closest('[id]')?.id || null, className: typeof element.className === "string" ? element.className : null, h: Math.round(element.getBoundingClientRect().height), w: Math.round(element.getBoundingClientRect().width) })),
            shortCount: short.length,
          };
        });
        if (state.overflow || state.outOfBounds || state.shortCount) failures.push(`${path}-${width}:${JSON.stringify(state)}`);
      }
    }
    assert.equal(pageErrors, 0);
    assert.equal(blockedWrites, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin-wide surface review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, routes: paths.length, widths: 3, pageErrors, blockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
