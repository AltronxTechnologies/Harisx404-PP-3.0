import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.CREDENTIALS_BASE_URL || "http://localhost:3000";
const cards = 'section[aria-labelledby="credential-collection-heading"] article';

test("Credentials collection and revised copy fit dark and light responsive widths", async () => {
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
        const response = await page.goto(`${baseUrl}/credentials`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.locator(cards).first().waitFor();
        for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate((selector) => ({
            theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            overflow: document.documentElement.scrollWidth - innerWidth,
            h1: document.querySelectorAll("main h1").length,
            count: document.querySelector('section[aria-labelledby="credential-collection-heading"] > div p')?.textContent.trim(),
            cards: [...document.querySelectorAll(selector)].map((card) => {
              const box = card.getBoundingClientRect();
              return { left: box.left, right: box.right, height: box.height, heading: Boolean(card.querySelector("h3")) };
            }),
            verified: document.querySelectorAll(`${selector} a[target="_blank"]`).length,
            unavailable: [...document.querySelectorAll(selector)].filter((card) => card.textContent.includes("Verification unavailable")).length,
          }), cards);
          assert.equal(state.theme, theme);
          assert.ok(state.overflow <= 1, `${theme} ${width}: ${state.overflow}px overflow`);
          assert.equal(state.h1, 1);
          assert.equal(state.count, "05 published");
          assert.equal(state.cards.length, 5);
          assert.ok(state.cards.every((card) => card.left >= 0 && card.right <= width + 1 && Math.abs(card.height - 232) < 1 && card.heading), `${theme} ${width}: ${JSON.stringify(state.cards)}`);
          assert.equal(state.verified, 4);
          assert.equal(state.unavailable, 1);
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

test("Credentials copy, verification and local navigation preserve intended semantics", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, permissions: ["clipboard-read", "clipboard-write"] });
    await page.goto(`${baseUrl}/credentials`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    assert.match(await page.title(), /^Credentials \|/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/credentials$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    const links = page.locator(`${cards} a[target="_blank"]`);
    assert.equal(await links.count(), 4);
    for (const link of await links.all()) {
      assert.match(await link.getAttribute("href"), /^https:\/\//);
      assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
      assert.match(await link.innerText(), /Verify credential/i);
    }
    const cisco = page.locator(cards).filter({ has: page.getByRole("heading", { name: "Introduction to Cybersecurity" }) });
    const fullId = await cisco.locator('p[title]').filter({ hasText: "Credential ID:" }).getAttribute("title");
    await cisco.getByRole("button", { name: "Copy credential ID for Introduction to Cybersecurity" }).click();
    await cisco.getByRole("button", { name: "Credential ID copied" }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), fullId);
    const unlinked = page.locator(cards).filter({ has: page.getByRole("heading", { name: /Delta 2\.0/ }) });
    assert.equal(await unlinked.getByRole("link").count(), 0);
    assert.match(await unlinked.innerText(), /Recorded[\s\S]*Verification unavailable/i);

    await page.getByRole("link", { name: "Get In Touch" }).click();
    await page.waitForURL((url) => url.pathname === "/contact");
    await page.goBack();
    await page.locator(cards).first().waitFor();
    assert.equal(await page.locator(cards).count(), 5);
  } finally {
    await browser.close();
  }
});

test("Credentials copy remains tappable and cards reflow with enlarged text", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, permissions: ["clipboard-read", "clipboard-write"] });
    await page.goto(`${baseUrl}/credentials`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    const copy = page.getByRole("button", { name: "Copy credential ID for Introduction to Cybersecurity" });
    await copy.tap();
    await page.getByRole("button", { name: "Credential ID copied" }).waitFor();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate((selector) => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        cards: [...document.querySelectorAll(selector)].map((card) => card.getBoundingClientRect()),
        title: document.querySelector("main h1").getBoundingClientRect(),
      }), cards);
      assert.ok(state.overflow <= 1, `${width} with 200% text: ${state.overflow}px overflow`);
      assert.ok(state.title.left >= 0 && state.title.right <= width + 1);
      assert.ok(state.cards.every((card) => card.left >= 0 && card.right <= width + 1), `${width}: ${JSON.stringify(state.cards)}`);
    }
  } finally {
    await browser.close();
  }
});
