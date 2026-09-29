import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog SSR content is visible before hydration at either viewport size", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const { path, width } of [
      { path: "/blog", width: 375 },
      { path: "/blog", width: 1440 },
      { path: "/blog?view=compact", width: 1440 },
      { path: "/blog?q=definitely-no-result", width: 375 },
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        // Next's inline stream reveal runs, but client bundles cannot hydrate or rewrite the URL.
        await page.route("**/_next/static/**/*.js", (route) => route.abort());
        const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200, `${path} at ${width}px should load`);
        assert.equal(new URL(page.url()).search, new URL(path, baseUrl).search);
        const collection = page.locator('section[aria-label="Browse articles"]');
        if (path.includes("q=")) {
          await collection.getByText("No matching articles").waitFor({ state: "visible", timeout: 10_000 });
        } else {
          await collection.locator('a[href^="/blog/"]').first().waitFor({ state: "visible", timeout: 10_000 });
          const next = collection.getByRole("navigation", { name: "Blog pages" }).getByRole("link", { name: "Next" });
          if (await next.count()) {
            assert.equal(await next.getAttribute("href"),
              path.includes("view=compact") ? "/blog?page=2&view=compact" : "/blog?page=2");
          }
        }
        assert.equal(await collection.getByText("Aligning articles to this screen").count(), 0);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
