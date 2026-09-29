import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog article stays readable across both themes and responsive widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`, { waitUntil: "domcontentloaded" });
        await page.locator("#blog-article img").first().waitFor({ state: "visible" });
        for (const width of [320, 360, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
          const state = await page.evaluate(() => {
            const article = document.querySelector("#blog-article");
            const box = article.getBoundingClientRect();
            const images = [...article.querySelectorAll("img")];
            return {
              width: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              articleLeft: box.left,
              articleRight: box.right,
              bodyText: article.textContent.trim().length,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              failedImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
            };
          });
          assert.equal(state.theme, theme, `${width}px theme`);
          assert.ok(state.scrollWidth <= state.width + 1, `${width}px ${theme} page overflow`);
          assert.ok(state.articleLeft >= 0 && state.articleRight <= state.width + 1, `${width}px ${theme} article bounds`);
          assert.ok(state.bodyText > 1000, `${width}px ${theme} article content`);
          assert.equal(state.failedImages, 0, `${width}px ${theme} broken images`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
