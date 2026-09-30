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
        await page.locator('#blog-article h2 > span[aria-hidden="true"]').first().waitFor({ state: "visible" });
        for (const width of [320, 360, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
          const state = await page.evaluate(() => {
            const article = document.querySelector("#blog-article");
            const box = article.getBoundingClientRect();
            const images = [...article.querySelectorAll("img")];
            const code = article.querySelector("pre");
            const copy = code?.parentElement?.querySelector('button[aria-label="Copy code"]');
            return {
              width: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              articleLeft: box.left,
              articleRight: box.right,
              bodyText: article.textContent.trim().length,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              failedImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
              codeMarkupValid: Boolean(code && code.parentElement?.tagName === "DIV" && code.querySelector("code") && !code.querySelector("div")),
              codeContained: Boolean(code && code.getBoundingClientRect().left >= 0 && code.getBoundingClientRect().right <= window.innerWidth + 1),
               copyVisible: Boolean(copy && getComputedStyle(copy).opacity !== "0" && copy.getBoundingClientRect().width > 0),
               numberedHeadingMatchesText: (() => {
                 const number = article.querySelector('h2 > span[aria-hidden="true"]');
                 const heading = number?.parentElement;
                 return Boolean(number?.textContent.endsWith(".") && getComputedStyle(number).fontSize === getComputedStyle(heading).fontSize && getComputedStyle(number).color === getComputedStyle(heading).color);
               })(),
               reactionButtonsFit: [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')].length === 4 && [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')].every((button) => button.scrollWidth <= button.clientWidth + 1),
               sideRails: (() => {
                 const frame = document.querySelector("#main-content").parentElement;
                 const columns = getComputedStyle(frame).gridTemplateColumns.split(" ").map(parseFloat);
                 return columns[0] > 0 || columns[2] > 0;
               })(),
            };
          });
          assert.equal(state.theme, theme, `${width}px theme`);
          assert.ok(state.scrollWidth <= state.width + 1, `${width}px ${theme} page overflow`);
          assert.ok(state.articleLeft >= 0 && state.articleRight <= state.width + 1, `${width}px ${theme} article bounds`);
          assert.ok(state.bodyText > 1000, `${width}px ${theme} article content`);
          assert.equal(state.failedImages, 0, `${width}px ${theme} broken images`);
          assert.equal(state.codeMarkupValid, true, `${width}px ${theme} valid fenced code structure`);
          assert.equal(state.codeContained, true, `${width}px ${theme} code viewport containment`);
           assert.equal(state.copyVisible, true, `${width}px ${theme} copy button visible without hover`);
           assert.equal(state.numberedHeadingMatchesText, true, `${width}px ${theme} heading numbers match typography`);
           assert.equal(state.reactionButtonsFit, true, `${width}px ${theme} reaction labels fit`);
           assert.equal(state.sideRails, false, `${width}px ${theme} no hatched side rails`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
