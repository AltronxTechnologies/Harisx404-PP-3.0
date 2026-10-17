import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

test("Home Blog covers stay 16:9 without horizontal overflow", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        assert.equal((await page.goto(process.env.PREVIEW_BASE_URL || "http://localhost:3000", { waitUntil: "domcontentloaded" }))?.status(), 200);
        await page.getByRole("heading", { name: "Latest write-ups." }).waitFor();
        for (const width of [320, 390, 768, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const result = await page.evaluate(() => {
            const heading = [...document.querySelectorAll("main h2, main h3")]
              .find((element) => element.textContent?.includes("Latest write-ups"));
            const cards = [...heading.closest("section").querySelectorAll('a[href^="/blog/"]')].slice(0, 3);
            const covers = cards.map((card) => card.querySelector("img").getBoundingClientRect());
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              ratios: covers.map((box) => box.width / box.height),
              coverWidths: covers.map((box) => box.width),
              cardWidths: cards.map((card) => card.getBoundingClientRect().width),
            };
          });
          assert.ok(result.overflow <= 1, `${width}px ${theme}: page fits`);
          assert.equal(result.ratios.length, 3, `${width}px ${theme}: featured and two companion covers render`);
          assert.ok(result.ratios.every((ratio) => Math.abs(ratio - 16 / 9) < 0.01), `${width}px ${theme}: every cover is 16:9`);
          if (width === 768) assert.ok(result.coverWidths.slice(1).every((cover) => cover >= 250), `${theme}: tablet companion images have enough room`);
          if (width >= 1024) {
            assert.ok(result.cardWidths[0] / (result.cardWidths[0] + result.cardWidths[1]) < 0.59, `${width}px ${theme}: laptop featured card stays narrower`);
            assert.ok(result.coverWidths.slice(1).every((cover) => cover >= (width >= 1280 ? 180 : 140)), `${width}px ${theme}: companion images balance the wider cards`);
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
