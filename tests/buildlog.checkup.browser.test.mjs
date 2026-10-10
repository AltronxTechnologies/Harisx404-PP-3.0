import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BUILDLOG_BASE_URL || "http://localhost:3000";

test("Buildlog keeps published projects and release controls contained at additional widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      try {
        const response = await page.goto(`${baseUrl}/buildlog`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.locator("[data-project-boundary]").first().waitFor();
        for (const width of [430, 640, 1280, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => ({
            theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            overflow: document.documentElement.scrollWidth - innerWidth,
            h1: document.querySelectorAll("main h1").length,
            projects: document.querySelectorAll("[data-project-boundary]").length,
            disclosures: document.querySelectorAll('button[aria-controls^="buildlog-shipped-"]').length,
            summary: document.querySelector("[data-release-summary]").getBoundingClientRect(),
          }));
          assert.equal(state.theme, theme, `${width}: theme`);
          assert.ok(state.overflow <= 1, `${width}: ${state.overflow}px document overflow`);
          assert.equal(state.h1, 1);
          assert.equal(state.projects, 4);
          assert.equal(state.disclosures, 4);
          assert.ok(state.summary.left >= 0 && state.summary.right <= width + 1);
        }
        assert.match(await page.title(), /^Buildlog \| What I Ship \|/);
        assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/buildlog$/);
        assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
        assert.ok(await page.locator('meta[name="twitter:image"]').getAttribute("content"));
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Buildlog touch disclosure, deep link and text enlargement preserve reading access", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/buildlog`, { waitUntil: "domcontentloaded" });
    const button = page.locator('button[aria-controls^="buildlog-shipped-"]').first();
    await button.waitFor();
    const id = (await button.getAttribute("aria-controls")).replace("buildlog-shipped-", "");
    await button.tap();
    await page.waitForFunction(() => document.querySelector('button[aria-controls^="buildlog-shipped-"]')?.getAttribute("aria-expanded") === "true");
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    assert.equal(new URL(page.url()).searchParams.get("open"), id);
    const list = page.locator(`#buildlog-shipped-${id} ol`);
    assert.ok(await list.evaluate((node) => node.scrollHeight > node.clientHeight && node.tabIndex === 0));
    await button.tap();
    await page.waitForFunction(() => document.querySelector('button[aria-controls^="buildlog-shipped-"]')?.getAttribute("aria-expanded") === "false");
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    await page.goto(`${baseUrl}/buildlog?open=${encodeURIComponent(id)}`, { waitUntil: "domcontentloaded" });
    await page.locator('button[aria-controls^="buildlog-shipped-"]').first().waitFor();
    assert.equal(await page.locator('main button[aria-controls^="buildlog-shipped-"][aria-expanded="true"]:visible').count(), 1);

    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        heading: document.querySelector("main h1").getBoundingClientRect(),
        disclosure: document.querySelector('button[aria-controls^="buildlog-shipped-"]').getBoundingClientRect(),
      }));
      assert.ok(state.overflow <= 1, `${width} with 200% text: ${state.overflow}px overflow`);
      assert.ok(state.heading.left >= 0 && state.heading.right <= width + 1);
      assert.ok(state.disclosure.left >= 0 && state.disclosure.right <= width + 1);
    }
  } finally {
    await browser.close();
  }
});
