import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("mobile article headings align with prose while permalinks remain visible and tappable", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
    const heading = page.locator("#blog-article h2:has(> a.anchor)").first();
    await heading.waitFor();
    const anchor = heading.locator("a.anchor");
    await heading.scrollIntoViewIfNeeded();
    const geometry = await anchor.evaluate((link) => {
      const box = link.getBoundingClientRect();
      const article = document.getElementById("blog-article").getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        left: box.left,
        right: box.right,
        articleLeft: article.left,
        headingLeft: link.parentElement.getBoundingClientRect().left,
        proseLeft: document.querySelector("#blog-article p").getBoundingClientRect().left,
        opacity: getComputedStyle(link).opacity,
        hittable: link.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)),
      };
    });
    assert.ok(geometry.width >= 24 && geometry.height >= 24, "permalink has a 24px target");
    assert.equal(geometry.headingLeft, geometry.proseLeft, "heading text aligns with article prose");
    assert.ok(geometry.left >= 0 && geometry.right <= geometry.articleLeft, "permalink sits in the left gutter without leaving the viewport");
    assert.equal(geometry.opacity, "1", "permalink is visible without hover on touch screens");
    assert.equal(geometry.hittable, true, "permalink receives pointer hits");
    const href = await anchor.getAttribute("href");
    assert.equal(href, `#${await heading.getAttribute("id")}`);
    await anchor.tap();
    assert.equal(new URL(page.url()).hash, href);
    await anchor.focus();
    assert.equal(await anchor.evaluate((link) => link === document.activeElement), true);
  } finally {
    await browser.close();
  }
});

test("desktop headings align with prose and gutter permalinks have visible keyboard focus", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
    const link = page.locator("#blog-article h2 a.anchor").first();
    await link.waitFor();
    await link.focus();
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#blog-article h2 a.anchor")).opacity === "1");
    const geometry = await link.evaluate((anchor) => {
      const box = anchor.getBoundingClientRect();
      const article = document.querySelector("#blog-article").getBoundingClientRect();
      return { left: box.left, right: box.right, articleLeft: article.left, headingLeft: anchor.parentElement.getBoundingClientRect().left, proseLeft: document.querySelector("#blog-article p").getBoundingClientRect().left, width: box.width, height: box.height, opacity: getComputedStyle(anchor).opacity };
    });
    assert.equal(geometry.headingLeft, geometry.proseLeft);
    assert.ok(geometry.left >= 0 && geometry.right <= geometry.articleLeft);
    assert.ok(geometry.width >= 24 && geometry.height >= 24);
    assert.equal(geometry.opacity, "1");

    await page.evaluate(() => {
      for (const level of [5, 6]) {
        const heading = document.createElement(`h${level}`);
        const anchor = document.createElement("a");
        anchor.className = "anchor";
        anchor.href = `#deep-heading-${level}`;
        heading.id = `deep-heading-${level}`;
        heading.append(anchor, `Deep heading ${level}`);
        document.getElementById("blog-article").append(heading);
      }
    });
    for (const level of [5, 6]) {
      const deepLink = page.locator(`#deep-heading-${level} a.anchor`);
      await deepLink.focus();
      await page.waitForFunction((selector) => getComputedStyle(document.querySelector(selector)).opacity === "1", `#deep-heading-${level} a.anchor`);
      const box = await deepLink.boundingBox();
      assert.ok(box.width >= 24 && box.height >= 24, `H${level} permalink has a usable target`);
      assert.ok(box.x >= 0 && box.x + box.width <= geometry.articleLeft, `H${level} permalink remains in the visible gutter`);
    }
  } finally {
    await browser.close();
  }
});

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
    assert.match(await trigger.locator("svg").last().locator("path").getAttribute("d"), /15-6-6-6 6/, "TOC pill points upward");
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

    await trigger.click();
    await page.mouse.click(8, 200);
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");
    await trigger.click();
    const top = await toc.evaluate((nav) => nav.getBoundingClientRect().top);
    await page.mouse.move(200, top + 20);
    await page.mouse.down();
    await page.mouse.move(200, top + 105, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");

    await trigger.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "true");
    assert.equal(await page.locator('main .blog-detail header a[href="/blog"]').evaluate((link) => link === document.activeElement), true, "focus leaves the hidden TOC");
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");

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
    const desktop = await page.evaluate(() => {
      const box = document.querySelector('nav[aria-label="Table of contents"]').getBoundingClientRect();
      return { center: (box.left + box.right) / 2, viewportCenter: innerWidth / 2 };
    });
    assert.ok(Math.abs(desktop.center - desktop.viewportCenter) < 1, "Desktop TOC must be centered");
  } finally {
    await browser.close();
  }
});

test("nested H2-H4 headings identify the reader's section on touch devices", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(`${baseUrl}/blog/web-development-concepts-in-swiftui`, { waitUntil: "domcontentloaded" });
    await page.locator("#hstack").waitFor();
    await page.evaluate(() => document.getElementById("hstack").scrollIntoView({ block: "start" }));
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await toc.locator("button").first().tap();
    await page.waitForTimeout(350);
    const levels = await toc.evaluate((nav) => {
      const buttons = [...nav.querySelectorAll("button")];
      const byTitle = (name) => buttons.find((button) => button.textContent.includes(name));
      const list = nav.querySelector(".overflow-y-auto");
      return {
        sizes: ["What is SwiftUI?", "Views", "HStack"].map((name) => getComputedStyle(byTitle(name)).fontSize),
        numberSizes: ["What is SwiftUI?", "Views"].map((name) => getComputedStyle(byTitle(name).querySelector("span.font-mono")).fontSize),
        active: byTitle("HStack")?.getAttribute("aria-current"),
        panelHeight: nav.getBoundingClientRect().height,
        scrollbar: getComputedStyle(list).scrollbarWidth,
        overflow: list.scrollHeight > list.clientHeight,
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    assert.deepEqual(levels.sizes, ["14px", "13px", "12px"]);
    assert.deepEqual(levels.numberSizes, ["14px", "13px"]);
    assert.equal(levels.active, "location");
    assert.ok(levels.panelHeight > 250 && levels.panelHeight <= 390, "mobile TOC should occupy at most half the viewport");
    assert.equal(levels.scrollbar, "thin");
    assert.equal(levels.overflow, true);
    assert.ok(levels.documentWidth <= 390);
    await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Table of contents"]');
      const label = nav.querySelector('span.font-mono');
      const box = label.getBoundingClientRect();
      label.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", clientX: box.x + 4, clientY: box.y + 4 }));
      document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", clientX: box.x + 4, clientY: box.y + 90 }));
    });
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");
  } finally {
    await browser.close();
  }
});

test("light-mode TOC keeps a clear active entry and hover feedback", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await toc.waitFor({ state: "attached" });
    await page.waitForFunction(() => {
      if (window.scrollY < 500) window.scrollTo(0, 650);
      return document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false";
    });
    await toc.locator("button").first().click();
    const active = toc.locator('button[aria-current="location"]');
    assert.equal(await active.count(), 1);
    assert.equal(await toc.evaluate((nav) => getComputedStyle(nav.firstElementChild).backgroundColor), "rgb(241, 242, 244)");
    const other = toc.getByRole("button", { name: "The skill that actually matters" });
    const before = await other.evaluate((button) => getComputedStyle(button).backgroundColor);
    await other.hover();
    await page.waitForTimeout(250);
    assert.notEqual(await other.evaluate((button) => getComputedStyle(button).backgroundColor), before);
    assert.equal(await active.getAttribute("aria-current"), "location");
    const gutters = await toc.evaluate((nav) => {
      const list = nav.querySelector(".overflow-y-auto").getBoundingClientRect();
      const selected = nav.querySelector('[aria-current="location"]').getBoundingClientRect();
      const hovered = [...nav.querySelectorAll("button")].find((button) => button.textContent.includes("The skill that actually matters")).getBoundingClientRect();
      return { left: selected.left - list.left, right: list.right - selected.right, selectedWidth: selected.width, hoverWidth: hovered.width };
    });
    assert.ok(Math.abs(gutters.left - gutters.right) < 1, "TOC rows have balanced side gutters");
    assert.equal(gutters.selectedWidth, gutters.hoverWidth, "active and hover surfaces share a width");
    const close = toc.getByRole("button", { name: "Close table of contents" });
    const closeBefore = await close.evaluate((button) => getComputedStyle(button).backgroundColor);
    await close.hover();
    await page.waitForTimeout(250);
    assert.notEqual(await close.evaluate((button) => getComputedStyle(button).backgroundColor), closeBefore);
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await toc.locator("button").first().click();
    assert.equal(await toc.evaluate((nav) => getComputedStyle(nav.firstElementChild).backgroundColor), "rgb(36, 36, 39)");
    await page.mouse.move(10, 10);
    const darkBefore = await other.evaluate((button) => getComputedStyle(button).backgroundColor);
    await other.hover();
    await page.waitForTimeout(250);
    assert.notEqual(await other.evaluate((button) => getComputedStyle(button).backgroundColor), darkBefore);
  } finally {
    await browser.close();
  }
});

test("long TOC outlines expose a styled internal scrollbar without dismissing on list scroll", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(`${baseUrl}/blog/introducing-blogfolio-v5`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await toc.waitFor({ state: "attached" });
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await toc.locator("button").first().tap();
    const state = await toc.evaluate((nav) => {
      const list = nav.querySelector(".overflow-y-auto");
      list.scrollTop = 150;
      return { overflow: list.scrollHeight > list.clientHeight, scrolled: list.scrollTop, width: getComputedStyle(list).scrollbarWidth, color: getComputedStyle(list).scrollbarColor, open: nav.getAttribute("data-open") };
    });
    assert.equal(state.overflow, true);
    assert.ok(state.scrolled > 0);
    assert.equal(state.width, "thin");
    assert.notEqual(state.color, "auto");
    assert.equal(state.open, "true");
    await toc.evaluate((nav) => {
      const list = nav.querySelector(".overflow-y-auto");
      const box = list.getBoundingClientRect();
      list.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", clientX: box.x + 30, clientY: box.y + 30 }));
      document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", clientX: box.x + 30, clientY: box.y + 120 }));
    });
    assert.equal(await toc.getAttribute("data-open"), "true", "dragging a scrolled outline must not dismiss it");
    const box = await toc.locator(".overflow-y-auto").boundingBox();
    const x = box.x + 30;
    const y = box.y + 30;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (const offset of [40, 80, 120, 160, 200, 240, 280]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + offset }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");
  } finally {
    await browser.close();
  }
});

test("a native touch pull-down dismisses the open TOC", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await toc.waitFor({ state: "attached" });
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await toc.locator("button").first().tap();
    await page.waitForTimeout(350);
    const box = await toc.locator("span.font-mono").first().boundingBox();
    const x = box.x + 20;
    const y = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (const offset of [20, 40, 60, 80, 110]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + offset }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("data-open") === "false");
  } finally {
    await browser.close();
  }
});
