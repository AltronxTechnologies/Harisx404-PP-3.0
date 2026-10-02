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
        await page.locator('#blog-article h2 > a.anchor > span[aria-hidden="true"]').first().waitFor({ state: "visible" });
         for (const width of [320, 360, 375, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
          const state = await page.evaluate(() => {
             const article = document.querySelector("#blog-article");
             const box = article.getBoundingClientRect();
             const hero = document.querySelector(".blog-detail header");
             const kicker = hero.querySelector('a[href="/blog"]');
             const title = hero.querySelector("h1");
             const summary = hero.querySelector("p");
             const images = [...article.querySelectorAll("img")];
             const code = article.querySelector("pre");
             const copy = code?.parentElement?.querySelector('button[aria-label="Copy code"]');
             const codeWindow = article.querySelector(".blog-code-window");
              const meta = document.querySelector(".blog-detail [class*='border-b']");
              const metaActions = meta.firstElementChild;
              const metaDate = meta.querySelector("time");
              const copyUrl = meta.querySelector('button');
              const moreShare = meta.querySelector('button[aria-label="More share options"]');
              const metaBox = meta.getBoundingClientRect();
              const actionsBox = metaActions.getBoundingClientRect();
              const dateBox = metaDate.getBoundingClientRect();
             const headingScale = [2, 3, 4, 5, 6].map((level) => {
               const heading = document.createElement(`h${level}`);
               heading.textContent = "Nested heading";
               article.appendChild(heading);
               const style = getComputedStyle(heading);
               const metrics = [parseFloat(style.fontSize), parseInt(style.fontWeight, 10)];
               heading.remove();
               return metrics;
             });
             return {
              width: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              articleLeft: box.left,
               articleRight: box.right,
               headingAligned: Math.abs(article.querySelector("h2").getBoundingClientRect().left - article.querySelector("p").getBoundingClientRect().left) < 1,
              bodyText: article.textContent.trim().length,
               theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
               heroType: [kicker, title, summary].map((element) => [getComputedStyle(element).fontSize, getComputedStyle(element).fontWeight]),
               heroGaps: [title.getBoundingClientRect().top - kicker.getBoundingClientRect().bottom, summary.getBoundingClientRect().top - title.getBoundingClientRect().bottom],
               heroKickerHeight: kicker.getBoundingClientRect().height,
               heroTopGap: kicker.getBoundingClientRect().top - document.querySelector("#main-content").getBoundingClientRect().top - parseFloat(getComputedStyle(document.querySelector("#main-content")).paddingTop),
                heroToMetaGap: document.querySelector(".blog-detail time").closest(".relative.mt-14").getBoundingClientRect().top - hero.getBoundingClientRect().bottom,
                metaLayout: {
                  alignedWithArticle: Math.abs(metaBox.left - box.left) < 1 && Math.abs(metaBox.right - box.right) < 1,
                  maxWidth: metaBox.width <= 680,
                  noOverlap: dateBox.top >= actionsBox.bottom || actionsBox.right + 16 <= dateBox.left,
                  dateContained: dateBox.right <= metaBox.right + 1,
                  dateRightAligned: Math.abs(dateBox.right - metaBox.right) < 1,
                  dateWrapped: dateBox.top >= actionsBox.bottom,
                  type: [metaActions, metaDate, copyUrl].map((element) => [getComputedStyle(element).fontSize, getComputedStyle(element).fontWeight]),
                  controls: [copyUrl, moreShare].map((element) => element.getBoundingClientRect().height),
                  divider: [getComputedStyle(meta).borderBottomWidth, getComputedStyle(meta).borderBottomColor],
                },
               heroRules: ["::before", "::after"].map((side) => getComputedStyle(hero.parentElement.parentElement, side).height),
                heroBackground: (() => {
                  const background = hero.previousElementSibling;
                  return {
                    masked: getComputedStyle(background).maskImage.includes("55%"),
                    topOffset: background.getBoundingClientRect().top - hero.getBoundingClientRect().top,
                    paper: getComputedStyle(background.firstElementChild).backgroundImage.includes("Paper-texture-harisx404.jpg"),
                    imageCount: background.querySelectorAll("img").length,
                  };
                })(),
               ctaFooterGap: (() => {
                 const cta = [...document.querySelectorAll(".blog-detail section")].find((section) => section.textContent.includes("Available for opportunities"));
                 return document.querySelector("footer").getBoundingClientRect().top - cta.getBoundingClientRect().bottom;
               })(),
               heroTitleFits: title.getBoundingClientRect().left >= 0 && title.getBoundingClientRect().right <= innerWidth,
               failedImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
              codeMarkupValid: Boolean(code && code.parentElement?.tagName === "DIV" && code.querySelector("code") && !code.querySelector("div")),
              codeContained: Boolean(code && code.getBoundingClientRect().left >= 0 && code.getBoundingClientRect().right <= window.innerWidth + 1),
               copyVisible: Boolean(copy && getComputedStyle(copy).opacity !== "0" && copy.getBoundingClientRect().width > 0),
               codeFrameNeutral: Boolean(codeWindow && meta && getComputedStyle(codeWindow).borderTopColor === getComputedStyle(meta).borderBottomColor && getComputedStyle(codeWindow).paddingTop === "0px"),
               headingScale,
               numberedHeadingMatchesText: (() => {
                  const number = article.querySelector('h2 > a.anchor > span[aria-hidden="true"]');
                  const heading = number?.closest("h2");
                 return Boolean(number?.textContent.endsWith(".") && getComputedStyle(number).fontSize === getComputedStyle(heading).fontSize && getComputedStyle(number).color === getComputedStyle(heading).color);
               })(),
                 reactionButtonsFit: (() => {
                   const buttons = [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')];
                   return buttons.length === 4 && buttons.every((button) => {
                     const label = button.children[1];
                     return button.scrollWidth <= button.clientWidth + 1
                       && Math.abs(button.getBoundingClientRect().top - buttons[0].getBoundingClientRect().top) < 1
                       && button.getBoundingClientRect().height >= 44
                       && getComputedStyle(label).display !== "none"
                       && label.getBoundingClientRect().width > 0;
                   });
                 })(),
               sideRails: (() => {
                 const frame = document.querySelector("#main-content").parentElement;
                 const columns = getComputedStyle(frame).gridTemplateColumns.split(" ").map(parseFloat);
                 return columns[0] > 0 || columns[2] > 0;
               })(),
            };
          });
           assert.equal(state.theme, theme, `${width}px theme`);
           assert.deepEqual(state.heroType, [["12px", "500"], [width >= 768 ? "56px" : "46px", "500"], ["15px", "400"]], `${width}px ${theme} shared hero typography`);
           assert.deepEqual(state.heroGaps, [16, 16], `${width}px ${theme} hero rhythm`);
           assert.ok(state.heroKickerHeight >= 24, `${width}px ${theme} Blog link touch target`);
           assert.equal(state.heroTopGap, 56, `${width}px ${theme} locked page top spacing`);
            assert.equal(state.heroToMetaGap, 56, `${width}px ${theme} hero to metadata spacing`);
            assert.deepEqual(state.metaLayout, {
              alignedWithArticle: true,
              maxWidth: true,
              noOverlap: true,
              dateContained: true,
              dateRightAligned: true,
              dateWrapped: width < 390,
              type: [["14px", "400"], ["14px", "400"], ["14px", "400"]],
              controls: [24, 24],
              divider: ["1px", theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgb(214, 218, 222)"],
            }, `${width}px ${theme} metadata alignment and divider`);
           assert.deepEqual(state.heroRules, ["1px", "1px"], `${width}px ${theme} shared hero frame`);
           assert.deepEqual(state.heroBackground, {
              masked: true,
              topOffset: width >= 768 ? -176 : width >= 640 ? -144 : -128,
              paper: true,
              imageCount: 0,
            }, `${width}px ${theme} shared paper heading background`);
           assert.equal(state.ctaFooterGap, 0, `${width}px ${theme} CTA to Footer handoff`);
           assert.equal(state.heroTitleFits, true, `${width}px ${theme} article title fits`);
          assert.ok(state.scrollWidth <= state.width + 1, `${width}px ${theme} page overflow`);
           assert.ok(state.articleLeft >= 0 && state.articleRight <= state.width + 1, `${width}px ${theme} article bounds`);
           assert.equal(state.headingAligned, true, `${width}px ${theme} heading aligns with prose`);
          assert.ok(state.bodyText > 1000, `${width}px ${theme} article content`);
          assert.equal(state.failedImages, 0, `${width}px ${theme} broken images`);
          assert.equal(state.codeMarkupValid, true, `${width}px ${theme} valid fenced code structure`);
          assert.equal(state.codeContained, true, `${width}px ${theme} code viewport containment`);
           assert.equal(state.copyVisible, true, `${width}px ${theme} copy button visible without hover`);
           assert.equal(state.codeFrameNeutral, true, `${width}px ${theme} neutral single code frame`);
           assert.deepEqual(state.headingScale, [[24, 500], [20, 500], [16, 500], [15, 500], [14, 500]], `${width}px ${theme} article heading scale`);
           assert.equal(state.numberedHeadingMatchesText, true, `${width}px ${theme} heading numbers match typography`);
           assert.equal(state.reactionButtonsFit, true, `${width}px ${theme} reactions fit in one row`);
           assert.equal(state.sideRails, true, `${width}px ${theme} shared hatched side rails`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("article video embeds fit the reading column without clipping", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/blog/no-code-build-games-with-gamesalad`);
    const embeds = page.locator("#blog-article iframe");
    await embeds.first().waitFor();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await embeds.evaluateAll((items) => {
        const article = document.querySelector("#blog-article").getBoundingClientRect();
        return items.map((item) => {
          const box = item.getBoundingClientRect();
          return { left: box.left, right: box.right, width: box.width, ratio: box.width / box.height, articleLeft: article.left, articleRight: article.right };
        });
      });
      assert.equal(state.length, 2);
      assert.ok(state.every((item) => item.left >= item.articleLeft && item.right <= item.articleRight + 1 && Math.abs(item.ratio - 16 / 9) < 0.01), `${width}px video embeds stay visible`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px page has no overflow`);
    }
  } finally {
    await browser.close();
  }
});

test("long heading words keep their trailing permalink inside the phone reading column", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 640 } });
    await page.goto(`${baseUrl}/blog/how-to-use-signal-forms-in-angular`);
    const heading = page.locator("#blog-article h2:has-text('ControlValueAccessor')");
    await heading.waitFor();
    const bounds = await heading.evaluate((node) => {
      const article = document.querySelector("#blog-article");
      const link = node.querySelector("a.anchor").getBoundingClientRect();
      return { articleOverflow: article.scrollWidth - article.clientWidth, linkRight: link.right, articleRight: article.getBoundingClientRect().right };
    });
    assert.ok(bounds.articleOverflow <= 1);
    assert.ok(bounds.linkRight <= bounds.articleRight + 1);
  } finally {
    await browser.close();
  }
});
