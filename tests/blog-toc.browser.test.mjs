import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog TOC stays out of hidden tab order and honors reduced motion", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await toc.waitFor({ state: "attached" });
    assert.equal(await toc.getAttribute("aria-hidden"), "true");
    assert.equal(await toc.locator("button").first().getAttribute("tabindex"), "-1");

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    const trigger = toc.locator("button").first();
    const overlap = await page.evaluate(() => {
      const toc = document.querySelector('nav[aria-label="Table of contents"]').getBoundingClientRect();
      const chat = document.querySelector('button[aria-label="Toggle chat"]').getBoundingClientRect();
      return toc.left < chat.right && toc.right > chat.left && toc.top < chat.bottom && toc.bottom > chat.top;
    });
    assert.equal(overlap, false, "Mobile TOC must not cover the chat control");
    await trigger.click();
    const expandedOverlap = await page.evaluate(() => {
      const toc = document.querySelector('nav[aria-label="Table of contents"]').getBoundingClientRect();
      const chat = document.querySelector('button[aria-label="Toggle chat"]').getBoundingClientRect();
      return toc.left < chat.right && toc.right > chat.left && toc.top < chat.bottom && toc.bottom > chat.top;
    });
    assert.equal(expandedOverlap, false, "Open mobile TOC must sit above the chat control");
    const close = toc.getByRole("button", { name: "Close table of contents" });
    assert.equal(await close.evaluate((button) => button === document.activeElement), true);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"] button') === document.activeElement);
    assert.equal(await trigger.evaluate((button) => button === document.activeElement), true);

    await page.evaluate(() => {
      window.__tocScrollOptions = [];
      Element.prototype.scrollIntoView = function (options) { window.__tocScrollOptions.push(options); };
    });
    await trigger.click();
    await toc.getByRole("button", { name: "Code review is shifting targets" }).click();
    const result = await page.evaluate(() => ({
      scroll: window.__tocScrollOptions[0],
      hash: location.hash,
      focus: document.activeElement?.getAttribute("href"),
    }));
    assert.equal(result.scroll.behavior, "auto");
    assert.equal(result.hash, "#code-review-is-shifting-targets");
    assert.equal(result.focus, result.hash);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getBoundingClientRect().width >= 280);
    const desktop = await page.evaluate(() => ({
      articleRight: document.getElementById("blog-article").getBoundingClientRect().right,
      tocLeft: document.querySelector('nav[aria-label="Table of contents"]').getBoundingClientRect().left,
    }));
    assert.ok(desktop.tocLeft >= desktop.articleRight, "Desktop TOC must dock outside the reading column");
  } finally {
    await browser.close();
  }
});
