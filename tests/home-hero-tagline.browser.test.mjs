import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

test("Home rotating tagline keeps its dot beside and centered on every line", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(process.env.PREVIEW_BASE_URL || "http://localhost:3000", { waitUntil: "domcontentloaded" });
    const lines = new Set();
    const measure = () => page.evaluate(() => {
      const root = [...document.querySelectorAll("div")].find((node) =>
        node.className === "flex items-center gap-2.5 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary");
      const dot = root.firstElementChild.getBoundingClientRect();
      const slot = root.lastElementChild.getBoundingClientRect();
      const text = root.lastElementChild.firstElementChild;
      const range = document.createRange();
      range.selectNodeContents(text);
      const glyphs = range.getBoundingClientRect();
      return {
        line: text.textContent.trim(),
        horizontalGap: glyphs.left - dot.right,
        verticalOffset: glyphs.top + glyphs.height / 2 - (dot.top + dot.height / 2),
        clipped: glyphs.right > slot.right + 1,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await measure();
      lines.add(result.line);
      assert.ok(Math.abs(result.horizontalGap - 10) < 1, `${width}px: dot stays next to the status`);
      assert.ok(Math.abs(result.verticalOffset) < 1, `${width}px: dot and status share a centerline`);
      assert.equal(result.clipped, false, `${width}px: status remains visible`);
      assert.ok(result.overflow <= 1, `${width}px: page fits`);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    for (let attempt = 0; attempt < 8 && lines.size < 5; attempt++) {
      await page.waitForTimeout(3200);
      await page.waitForFunction(() => {
        const root = [...document.querySelectorAll("div")].find((node) =>
          node.className === "flex items-center gap-2.5 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary");
        const slot = root.lastElementChild;
        return slot.children.length === 1 && Number(getComputedStyle(slot.firstElementChild).opacity) > 0.99;
      });
      const result = await measure();
      lines.add(result.line);
      assert.ok(Math.abs(result.horizontalGap - 10) < 1 && Math.abs(result.verticalOffset) < 1, `${result.line}: dot stays aligned`);
      assert.equal(result.clipped, false, `${result.line}: line fits on small screens`);
    }
    assert.equal(lines.size, 5, "all rotating phrases remain available");
  } finally {
    await browser.close();
  }
});
