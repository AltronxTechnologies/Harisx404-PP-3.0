import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.LINKS_BASE_URL || "http://localhost:3000";
const nav = 'nav[aria-label="Social and professional links"]';

test("Links profile and destination cards remain contained in both themes across screen widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      try {
        const response = await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.locator(`${nav} li a`).first().waitFor();
        await page.waitForFunction(() => { const portrait = document.querySelector('main img[alt="Muhammad Haris"]'); return portrait?.complete && portrait.naturalWidth > 0; });
        for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate((selector) => {
            const links = [...document.querySelectorAll(`${selector} li a`)];
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              h1: document.querySelectorAll("main h1").length,
              cards: document.querySelectorAll(`${selector} li`).length,
              links: links.map((link) => { const bounds = link.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, height: bounds.height }; }),
              externalSafe: links.filter((link) => link.target === "_blank").every((link) => link.rel === "noopener noreferrer"),
            };
          }, nav);
          assert.equal(state.theme, theme);
          assert.ok(state.overflow <= 1, `${theme} ${width}: ${state.overflow}px overflow`);
          assert.equal(state.h1, 1);
          assert.equal(state.cards, 8);
          assert.equal(state.links.length, 8);
          assert.ok(state.links.every((link) => link.left >= 0 && link.right <= width + 1 && link.height >= 92), `${theme} ${width}: ${JSON.stringify(state.links)}`);
          assert.equal(state.externalSafe, true);
        }
        assert.deepEqual(errors, [], `${theme}: page/console errors`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Links internal, external and email actions keep their intended semantics", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, permissions: ["clipboard-read", "clipboard-write"] });
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.locator(nav).waitFor();
    assert.match(await page.title(), /^Links \|/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/links$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    assert.ok(await page.locator('meta[name="twitter:image"]').getAttribute("content"));
    const destinations = await page.locator(`${nav} li a`).evaluateAll((links) => links.map((link) => ({ href: link.getAttribute("href"), target: link.target })));
    assert.deepEqual(destinations.map((link) => link.href), [
      "https://github.com/harisx404", "https://tryhackme.com/p/harisx404", "https://www.credly.com/users/harisx404", "/resume",
      "https://www.linkedin.com/in/harisx404/", "https://x.com/harisx404", "mailto:itsharis.tech@gmail.com", "/",
    ]);
    assert.equal(destinations.filter((link) => link.target === "_blank").length, 5);
    await page.getByRole("link", { name: /Resume Experience/ }).click();
    await page.waitForURL((url) => url.pathname === "/resume");
    await page.goBack();
    await page.getByRole("link", { name: /Send a message/ }).click();
    await page.waitForURL((url) => url.pathname === "/contact");
    await page.goBack();
    assert.equal(await page.locator(`${nav} li`).count(), 8);
    await page.getByRole("button", { name: "itsharis.tech@gmail.com" }).click();
    await page.getByRole("button", { name: "Copied!" }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "itsharis.tech@gmail.com");
  } finally {
    await browser.close();
  }
});

test("Links remain reachable with touch and 200% text sizing", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.locator(`${nav} li a`).first().waitFor();
    await page.locator(`${nav} a[href="/resume"]`).tap();
    await page.waitForURL((url) => url.pathname === "/resume");
    await page.goBack();
    await page.locator(nav).waitFor();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate((selector) => {
        const h1 = document.querySelector("main h1").getBoundingClientRect();
        const links = [...document.querySelectorAll(`${selector} li a`)].map((link) => link.getBoundingClientRect());
        return { overflow: document.documentElement.scrollWidth - innerWidth, h1, links };
      }, nav);
      assert.ok(state.overflow <= 1, `${width} with 200% text: ${state.overflow}px overflow`);
      assert.ok(state.h1.left >= 0 && state.h1.right <= width + 1);
      assert.ok(state.links.every((link) => link.left >= 0 && link.right <= width + 1), `${width}: ${JSON.stringify(state.links)}`);
    }
  } finally {
    await browser.close();
  }
});
