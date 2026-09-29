import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog index cards stay visible across both themes and responsive widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
        const collection = page.locator('section[aria-label="Browse articles"]');
        await collection.locator('a[href^="/blog/"]').first().waitFor({ state: "visible" });
        for (const width of [320, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
          await collection.locator('a[href^="/blog/"]').first().waitFor({ state: "visible" });
          const state = await page.evaluate(() => {
            const firstCard = document.querySelector('section[aria-label="Browse articles"] a[href^="/blog/"]');
            const box = firstCard.getBoundingClientRect();
            return {
              width: window.innerWidth,
              pageWidth: document.documentElement.scrollWidth,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              firstCardWidth: box.width,
              firstCardLeft: box.left,
              firstCardRight: box.right,
            };
          });
          assert.equal(state.theme, theme, `${width}px theme`);
          assert.ok(state.pageWidth <= state.width + 1, `${width}px ${theme} page overflow`);
          assert.ok(state.firstCardWidth > 0 && state.firstCardLeft >= 0 && state.firstCardRight <= state.width + 1,
            `${width}px ${theme} first card bounds`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
