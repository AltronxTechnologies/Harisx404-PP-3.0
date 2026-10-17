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
            const covers = [...heading.closest("section").querySelectorAll('a[href^="/blog/"] img')]
              .map((image) => image.getBoundingClientRect());
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              ratios: covers.map((box) => box.width / box.height),
            };
          });
          assert.ok(result.overflow <= 1, `${width}px ${theme}: page fits`);
          assert.equal(result.ratios.length, 3, `${width}px ${theme}: featured and two companion covers render`);
          assert.ok(result.ratios.every((ratio) => Math.abs(ratio - 16 / 9) < 0.01), `${width}px ${theme}: every cover is 16:9`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
