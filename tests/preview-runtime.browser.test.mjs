import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:8080";
const routes = [
  "/",
  "/about",
  "/projects",
  "/blog",
  "/contact",
  "/links",
  "/credentials",
  "/buildlog",
  "/community-wall",
  "/resume",
  "/legal/privacy",
  "/legal/terms",
];

test("header remains usable without JS while hydrated greeting leads to navigation and hero", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, javaScriptEnabled: false });
      try {
        const page = await context.newPage();
        for (const route of ["/", "/about"]) {
          const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
          assert.equal(response?.status(), 200);
          const fallbackNav = page.locator("header nav noscript").getByRole("link", { name: width < 768 ? "Explore" : "Projects" });
          assert.equal(await fallbackNav.isVisible(), true, `${route} ${width}px: static navigation is usable without JS`);
        }
      } finally {
        await context.close();
      }
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      try {
        await page.clock.install();
        await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
        assert.equal(await page.locator("header nav").getByText(/^Good (Morning|Afternoon|Evening)$/).isVisible(), true);
        await page.getByRole("button", { name: "Toggle chat" }).waitFor();
        await page.clock.runFor(3100);
        const navControl = width < 768
          ? page.getByRole("button", { name: "Open menu & search" })
          : page.getByRole("link", { name: "Projects", exact: true }).first();
        await navControl.waitFor();
        assert.equal(await navControl.isVisible(), true);
        await page.waitForFunction(() => !document.querySelector("header nav [inert]"));
        await page.getByRole("region", { name: "Current status" }).waitFor();
        const portrait = page.locator('main img[alt="Muhammad Haris"]').first();
        await portrait.waitFor();
        assert.equal(await portrait.isVisible(), true);
        assert.equal(await portrait.evaluate((node) => getComputedStyle(node.parentElement.parentElement.parentElement.parentElement).opacity), "1");
        const heroTitle = page.getByRole("heading", { level: 1 });
        assert.equal(await heroTitle.isVisible(), true);
        assert.equal(await heroTitle.evaluate((node) => getComputedStyle(node.parentElement).opacity), "1");
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("public preview routes settle without persistent loaders or runtime errors", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const pending = new Set();
      const errors = [];

      page.on("request", (request) => pending.add(request.url()));
      page.on("requestfinished", (request) => pending.delete(request.url()));
      page.on("requestfailed", (request) => {
        pending.delete(request.url());
        errors.push(`${request.url()}: ${request.failure()?.errorText || "request failed"}`);
      });
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(response?.status(), 200, `${route} should return 200`);

      let cleared = false;
      for (let attempt = 0; attempt < 150; attempt += 1) {
        const statuses = await page.locator("[role='status']").allTextContents();
        if (!statuses.some((value) => /loading/i.test(value))) {
          cleared = true;
          break;
        }
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(500);

      const criticalRequest = (url) => !/\/_next\/(webpack-hmr|turbopack)/.test(url) && !/\/_next\/image\?url=https%3A%2F%2F/i.test(url);
      for (let attempt = 0; attempt < 30 && [...pending].some(criticalRequest); attempt += 1) {
        await page.waitForTimeout(100);
      }

      const brokenImages = await page.evaluate(() =>
        [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      );
      const applicationPending = [...pending].filter(criticalRequest);

      assert.equal(cleared, true, `${route} loading boundary should clear`);
      assert.deepEqual(
        applicationPending,
        [],
        `${route} should have no pending application requests`,
      );
      assert.deepEqual(errors, [], `${route} should have no browser errors`);
      assert.deepEqual(brokenImages, [], `${route} should have no broken images`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
