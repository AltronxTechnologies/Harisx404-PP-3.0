import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL || "http://localhost:3000";

test("Admin-only frame hides public chrome without changing the public frame", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseUrl}/admin/login`);
      await page.getByRole("heading", { name: "Admin Portal" }).waitFor();
      const state = await page.evaluate(() => ({
        marker: !!document.querySelector("[data-admin-root]"),
        navbar: [...document.querySelectorAll("body > div > header")].some((node) => getComputedStyle(node).display !== "none"),
        footer: [...document.querySelectorAll("body > div > footer")].some((node) => getComputedStyle(node).display !== "none"),
        chat: [...document.querySelectorAll("body > div")].some((node) => node.querySelector(':scope > button[aria-label="Toggle chat"]') && getComputedStyle(node).display !== "none"),
        canonical: !!document.querySelector('link[rel="canonical"]'),
        mainWidth: document.querySelector("#main-content").getBoundingClientRect().width,
      }));
      assert.equal(state.marker, true);
      assert.equal(state.navbar, false);
      assert.equal(state.footer, false);
      assert.equal(state.chat, false);
      assert.equal(state.canonical, false);
      assert.ok(state.mainWidth <= width + 1 && state.mainWidth >= width - 1, `${width}px Admin frame`);
    }

    await page.goto(`${baseUrl}/`);
    await page.locator("body > div > footer").waitFor();
    const publicState = await page.evaluate(() => ({
      marker: !!document.querySelector("[data-admin-root]"),
      navbar: [...document.querySelectorAll("body > div > header")].some((node) => getComputedStyle(node).display !== "none"),
      footer: [...document.querySelectorAll("body > div > footer")].some((node) => getComputedStyle(node).display !== "none"),
      chat: [...document.querySelectorAll("body > div")].some((node) => node.querySelector(':scope > button[aria-label="Toggle chat"]') && getComputedStyle(node).display !== "none"),
      canonical: !!document.querySelector('link[rel="canonical"]'),
    }));
    assert.deepEqual(publicState, { marker: false, navbar: true, footer: true, chat: true, canonical: true });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
