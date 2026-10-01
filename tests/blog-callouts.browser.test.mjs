import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog notes and quotes stay contained and readable in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 780 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      await page.goto(`${baseUrl}/blog/introducing-blogfolio-v5`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.locator('#blog-article blockquote[data-note-type="warning"]').first().waitFor();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const notes = await page.evaluate(() => {
          const article = document.querySelector("#blog-article");
          return [...article.querySelectorAll("blockquote[data-note-type]")].map((node) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              type: node.getAttribute("data-note-type"),
              left: rect.left,
              right: rect.right,
              background: style.backgroundImage,
              insetDecoration: getComputedStyle(node.querySelector(".blog-container"), "::after").content,
              bodyWeight: getComputedStyle(node.querySelector(".blog-container > div")).fontWeight,
              text: node.textContent.trim(),
            };
          });
        });
        for (const type of ["idea", "info", "thought", "warning"]) {
          assert.ok(notes.some((note) => note.type === type), `${theme} ${width}px missing ${type}`);
        }
        for (const note of notes) {
          assert.equal(note.background, "none", `${theme} ${width}px ${note.type} has no stripes`);
          assert.equal(note.insetDecoration, "none", `${theme} ${width}px ${note.type} has one frame`);
          assert.equal(note.bodyWeight, "400", `${theme} ${width}px ${note.type} uses reading weight`);
          assert.ok(note.left >= 0 && note.right <= width + 1, `${theme} ${width}px ${note.type} stays on screen`);
          assert.ok(note.text.length > 5, `${theme} ${width}px ${note.type} retains content`);
        }
      }
      await page.goto(`${baseUrl}/blog/the-cite-html-tag`, { waitUntil: "domcontentloaded", timeout: 60000 });
      const quote = page.locator("#blog-article blockquote:not([data-note-type])").first();
      await quote.waitFor();
      const quoteStyle = await quote.evaluate((node) => ({
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
        background: getComputedStyle(node).backgroundColor,
        border: getComputedStyle(node).borderLeftWidth,
      }));
      assert.ok(quoteStyle.left >= 0 && quoteStyle.right <= 1441, `${theme} ordinary quote stays contained`);
      assert.notEqual(quoteStyle.background, "rgba(0, 0, 0, 0)", `${theme} ordinary quote has a surface`);
      assert.equal(quoteStyle.border, "4px", `${theme} ordinary quote keeps its editorial rule`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
