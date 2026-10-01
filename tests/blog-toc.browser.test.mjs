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
    const levels = await toc.evaluate((nav) => {
      const buttons = [...nav.querySelectorAll("button")];
      const byTitle = (name) => buttons.find((button) => button.textContent.includes(name));
      const list = nav.querySelector(".overflow-y-auto");
      return {
        sizes: ["What is SwiftUI?", "Views", "HStack"].map((name) => getComputedStyle(byTitle(name)).fontSize),
        active: byTitle("HStack")?.getAttribute("aria-current"),
        scrollbar: getComputedStyle(list).scrollbarWidth,
        overflow: list.scrollHeight > list.clientHeight,
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    assert.deepEqual(levels.sizes, ["14px", "13px", "12px"]);
    assert.equal(levels.active, "location");
    assert.equal(levels.scrollbar, "thin");
    assert.equal(levels.overflow, true);
    assert.ok(levels.documentWidth <= 390);
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
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await toc.locator("button").first().click();
    const active = toc.locator('button[aria-current="location"]');
    assert.equal(await active.count(), 1);
    const other = toc.getByRole("button", { name: "The skill that actually matters" });
    const before = await other.evaluate((button) => getComputedStyle(button).backgroundColor);
    await other.hover();
    await page.waitForTimeout(250);
    assert.notEqual(await other.evaluate((button) => getComputedStyle(button).backgroundColor), before);
    assert.equal(await active.getAttribute("aria-current"), "location");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
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
  } finally {
    await browser.close();
  }
});
