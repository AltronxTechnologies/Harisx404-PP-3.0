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
        for (const width of [320, 390, 768, 900, 1023, 1024, 1280, 1440]) {
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
              cardHeights: cards.map((card) => card.getBoundingClientRect().height),
              sideImageGaps: cards.slice(1).map((card, index) => card.getBoundingClientRect().height - covers[index + 1].height - 26),
              sideTitlesFit: cards.slice(1).map((card) => {
                const title = card.querySelector("h3");
                return title.scrollHeight <= title.clientHeight + 1;
              }),
              sideSpacing: cards.slice(1).map((card) => {
                const title = card.querySelector("h3");
                const description = title.nextElementSibling;
                const actions = description.nextElementSibling;
                return {
                  titleToDescription: Math.round(description.getBoundingClientRect().top - title.getBoundingClientRect().bottom),
                  descriptionToActions: Math.round(actions.getBoundingClientRect().top - description.getBoundingClientRect().bottom),
                };
              }),
              dates: cards.map((card) => card.querySelectorAll("time").length),
              sideReadingTimes: cards.slice(1).map((card) => /\d+ min read/i.test(card.textContent)),
            };
          });
          assert.ok(result.overflow <= 1, `${width}px ${theme}: page fits`);
          assert.equal(result.ratios.length, 3, `${width}px ${theme}: featured and two companion covers render`);
          assert.ok(result.ratios.every((ratio) => Math.abs(ratio - 16 / 9) < 0.01), `${width}px ${theme}: every cover is 16:9`);
          assert.deepEqual(result.dates, [1, 1, 1], `${width}px ${theme}: all cards show a date`);
          assert.deepEqual(result.sideReadingTimes, [true, true], `${width}px ${theme}: side cards show reading time`);
          if (width >= 768 && width < 1024) {
            assert.ok(result.coverWidths.slice(1).every((cover) => Math.abs(cover - 320) < 1), `${width}px ${theme}: tablet companion images fill their frames`);
            assert.ok(result.sideImageGaps.every((gap) => gap <= 26), `${width}px ${theme}: tablet cards have no large empty image slots`);
            assert.ok(result.sideTitlesFit.every(Boolean), `${width}px ${theme}: tablet titles remain readable`);
            if (width === 768 || width === 900) {
              assert.deepEqual(result.sideSpacing, [
                { titleToDescription: 8, descriptionToActions: 16 },
                { titleToDescription: 8, descriptionToActions: 16 },
              ], `${width}px ${theme}: both side cards use the same spacing`);
            }
          }
          if (width >= 1024) {
            const featuredShare = result.cardWidths[0] / (result.cardWidths[0] + result.cardWidths[1]);
            assert.ok(featuredShare >= 0.39 && featuredShare <= 0.41, `${width}px ${theme}: columns balance the 16:9 images`);
            assert.ok(result.coverWidths.slice(1).every((cover) => cover >= (width >= 1280 ? 340 : 250)), `${width}px ${theme}: companion images fill their cards`);
            if (width >= 1280) {
              assert.ok(result.cardHeights[0] <= 485, `${width}px ${theme}: featured card stays compact`);
              assert.ok(result.sideImageGaps.every((gap) => gap <= 16), `${width}px ${theme}: side cards do not leave large empty image slots`);
            }
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
