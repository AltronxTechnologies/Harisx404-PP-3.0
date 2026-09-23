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

      const brokenImages = await page.evaluate(() =>
        [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      );
      const applicationPending = [...pending].filter(
        (url) => !/\/_next\/(webpack-hmr|turbopack)/.test(url),
      );

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
