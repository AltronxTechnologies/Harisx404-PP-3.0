import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Admin-selected related Blog cards follow section rhythm and responsive visibility", async (t) => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}/blog/build-link-previews-with-playwright-and-the-popover-api`);
        await page.locator("#blog-article").waitFor();
        if (await page.locator('[aria-labelledby="related-articles-heading"] .grid > a').count() !== 3) {
          t.skip("requires three published Admin selections on the preview article");
          return;
        }
        await page.evaluate(() => document.fonts.ready);
        for (const width of [320, 390, 639, 640, 768, 1023, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const section = document.querySelector('[aria-labelledby="related-articles-heading"]');
            const reactions = document.querySelector('[aria-labelledby="article-reactions-heading"]');
            const kicker = section.querySelector("p");
            const heading = section.querySelector("h2");
            const grid = section.querySelector(".grid");
            const ctaWrapper = section.nextElementSibling;
            const cta = ctaWrapper.querySelector("section");
            const ctaKicker = cta.querySelector("p");
            const cards = [...grid.children];
            const visible = cards.filter((card) => getComputedStyle(card).display !== "none");
            const bounds = (node) => node.getBoundingClientRect();
            const cardText = [visible[0].querySelector("h3"), visible[0].querySelector("p"), visible[0].querySelector('div[class*="border-t"] > span:last-child')];
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              gaps: [
                bounds(kicker).top - bounds(reactions).bottom,
                bounds(heading).top - bounds(kicker).bottom,
                bounds(grid).top - bounds(heading).bottom,
              ],
              ctaHandoff: [
                bounds(section).bottom - bounds(grid).bottom,
                bounds(ctaWrapper).top - bounds(section).bottom,
                bounds(ctaKicker).top - bounds(grid).bottom,
                bounds(document.querySelector("footer")).top - bounds(cta).bottom,
              ],
              kickerType: [getComputedStyle(kicker).fontSize, getComputedStyle(kicker).fontWeight, getComputedStyle(kicker).color],
              headingType: [getComputedStyle(heading).fontSize, getComputedStyle(heading).fontWeight, getComputedStyle(heading).fontFamily],
              cardType: cardText.map((element) => element ? [getComputedStyle(element).fontSize, getComputedStyle(element).fontWeight, getComputedStyle(element).color] : null),
              allLinks: cards.map((card) => card.getAttribute("href")),
              visibleLinks: visible.map((card) => card.getAttribute("href")),
              positions: visible.map((card) => ({ x: bounds(card).x, y: bounds(card).y, height: bounds(card).height })),
              cardsFit: visible.every((card) => {
                const footer = card.querySelector('div[class*="border-t"]');
                return bounds(card).left >= 0 && bounds(card).right <= innerWidth
                  && card.scrollWidth <= card.clientWidth + 1
                  && footer?.scrollWidth <= footer?.clientWidth + 1;
              }),
            };
          });
          assert.equal(state.theme, theme);
          assert.ok(state.overflow <= 1, `${theme} ${width}px page overflow`);
          assert.deepEqual(state.gaps, [112, 16, 56], `${theme} ${width}px section rhythm`);
          assert.deepEqual(state.ctaHandoff, [64, 48, width >= 768 ? 144 : 136, 0], `${theme} ${width}px About-page CTA handoff`);
          assert.deepEqual(state.kickerType, ["12px", "500", theme === "dark" ? "rgb(161, 161, 161)" : "rgb(94, 95, 110)"], `${theme} ${width}px shared kicker`);
          assert.equal(state.headingType[0], width >= 768 ? "56px" : "46px");
          assert.equal(state.headingType[1], "500");
          assert.ok(state.headingType[2].includes("Instrument Serif"));
          const primary = theme === "dark" ? "rgb(250, 250, 250)" : "rgb(15, 23, 42)";
          const secondary = theme === "dark" ? "rgb(161, 161, 161)" : "rgb(94, 95, 110)";
          assert.deepEqual(state.cardType[0], ["24px", "500", primary], `${theme} ${width}px card title`);
          if (state.cardType[1]) assert.deepEqual(state.cardType[1], ["14px", "400", secondary], `${theme} ${width}px card summary`);
          assert.deepEqual(state.cardType[2], ["11px", "400", secondary], `${theme} ${width}px card action`);
          assert.equal(state.allLinks.length, 3, "preview article has three Admin-selected posts");
          assert.deepEqual(state.visibleLinks, state.allLinks.slice(0, width >= 1024 ? 3 : 2), `${theme} ${width}px selected order and visibility`);
          assert.equal(state.cardsFit, true, `${theme} ${width}px card content fits`);
          if (width < 640) {
            assert.ok(state.positions[1].y > state.positions[0].y, `${theme} ${width}px cards stack`);
          } else {
            assert.ok(state.positions.every((card) => card.y === state.positions[0].y), `${theme} ${width}px cards share a row`);
            assert.ok(state.positions.every((card) => card.height === state.positions[0].height), `${theme} ${width}px card heights align`);
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

test("article without related selections retains its CTA fallback spacing", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const browse = page.getByRole("link", { name: "Browse all articles" });
    await browse.waitFor();
    assert.equal(await page.locator("#related-articles-heading").count(), 0);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const gap = await browse.evaluate((link) => {
        const fallback = link.parentElement;
        const wrapper = fallback.nextElementSibling;
        const kicker = wrapper.querySelector("section p");
        return {
          wrapper: wrapper.getBoundingClientRect().top - fallback.getBoundingClientRect().bottom,
          kicker: kicker.getBoundingClientRect().top - link.getBoundingClientRect().bottom,
        };
      });
      assert.deepEqual(gap, { wrapper: 56, kicker: width >= 768 ? 144 : 136 });
    }
  } finally {
    await browser.close();
  }
});
