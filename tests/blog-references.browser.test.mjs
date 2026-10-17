import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const url = `${process.env.BLOG_BASE_URL || "http://localhost:3000"}/blog/reliable-rag`;

test("article sources are compact and external links show a useful hover and focus preview", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        assert.equal((await page.goto(url, { waitUntil: "domcontentloaded" }))?.status(), 200);
        const references = page.locator("#blog-article h2#references");
        const links = page.locator("#blog-article h2#references + ol > li a");
        await references.waitFor();
        assert.equal(await links.count(), 4);
        const typography = await references.evaluate((heading) => ({
          heading: getComputedStyle(heading).fontSize,
          item: getComputedStyle(heading.nextElementSibling.firstElementChild).fontSize,
          columns: getComputedStyle(heading.nextElementSibling.firstElementChild).gridTemplateColumns,
        }));
        assert.equal(typography.heading, "12px");
        assert.equal(typography.item, "13px");
        assert.match(typography.columns, /24px/);

        const source = links.nth(1);
        await source.hover();
        const preview = page.locator('.link-preview-popover:popover-open');
        await preview.waitFor();
        assert.match(await preview.innerText(), /Microsoft Learn: Hybrid search.*learn\.microsoft\.com/s);
        assert.equal(await source.getAttribute("href"), "https://learn.microsoft.com/azure/search/hybrid-search-overview");
        await page.mouse.move(0, 0);
        await page.waitForFunction(() => !document.querySelector('.link-preview-popover:popover-open'));
        await source.focus();
        await preview.waitFor();
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }

    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const page = await touch.newPage();
      await page.goto(url);
      const source = page.locator("#blog-article h2#references + ol > li a").first();
      await source.waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      assert.equal(await source.getAttribute("target"), "_blank");
      assert.equal(await page.locator(".link-preview-popover").count(), 0);
    } finally {
      await touch.close();
    }
  } finally {
    await browser.close();
  }
});
