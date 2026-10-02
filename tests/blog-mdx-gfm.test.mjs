import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import * as runtime from "react/jsx-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("new Blog table syntax renders accessible table cells instead of pipe text", async () => {
  const { default: Content } = await evaluate(
    "| Topic | Detail |\n| --- | --- |\n| One | Two |",
    { ...runtime, remarkPlugins: [remarkGfm] },
  );
  const html = renderToStaticMarkup(createElement(Content));
  assert.match(html, /<table>/);
  assert.match(html, /<th>Topic<\/th>/);
  assert.match(html, /<td>Two<\/td>/);
  const renderer = await readFile(new URL("../app/components/mdx.tsx", import.meta.url), "utf8");
  assert.match(renderer, /remarkPlugins: \[remarkGfm, \(\) => addHeadingIds\]/);
});

test("Blog table badges have readable contrast in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 780 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
        await page.locator("#blog-article p").first().waitFor();
        const colors = await page.evaluate(() => {
          const article = document.querySelector("#blog-article");
          const table = document.createElement("figure");
          table.className = "table-card";
          table.innerHTML = '<div class="table-scroll"><table><thead><tr><th><span class="th-badge">Topic</span></th></tr></thead></table></div>';
          article.append(table);
          const badge = table.querySelector(".th-badge");
          const result = {
            foreground: getComputedStyle(badge).color,
            badgeBackground: getComputedStyle(badge).backgroundColor,
            tableBackground: getComputedStyle(table.querySelector(".table-scroll")).backgroundColor,
            textSize: getComputedStyle(badge).fontSize,
            contained: table.getBoundingClientRect().right <= innerWidth && document.documentElement.scrollWidth <= innerWidth,
          };
          table.remove();
          return result;
        });
        const channels = (color) => color.match(/[\d.]+/g).map(Number);
        const [r, g, b, opacity] = channels(colors.badgeBackground);
        const underlying = channels(colors.tableBackground);
        const background = [r, g, b].map((value, index) => value * opacity + underlying[index] * (1 - opacity));
        const luminance = (values) => {
          const [red, green, blue] = values.slice(0, 3).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };
        const fg = luminance(channels(colors.foreground));
        const bg = luminance(background);
        assert.ok((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05) >= 4.5, `${theme} 11px table header meets AA contrast`);
        assert.equal(colors.textSize, "11px");
        assert.equal(colors.contained, true, `${theme} table frame stays inside the phone viewport`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
