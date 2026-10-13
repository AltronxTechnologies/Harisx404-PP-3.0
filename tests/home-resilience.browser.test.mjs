import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("homepage keeps useful cards when WebGL and external icon delivery fail", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (typeof type === "string" && /webgl/i.test(type)) return null;
        return getContext.call(this, type, ...options);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    const contact = page.getByRole("link", { name: "Contact me about a project" });
    await contact.waitFor();
    await contact.scrollIntoViewIfNeeded();
    await contact.locator("svg").first().waitFor();
    assert.equal(await contact.getAttribute("href"), "/contact");
    assert.equal(await contact.locator("canvas").evaluate((node) => getComputedStyle(node).opacity), "0");
    const account = page.getByRole("link", { name: "TryHackMe profile" });
    await account.getByText("TR", { exact: true }).waitFor();
    assert.equal(await account.getAttribute("href"), "https://tryhackme.com/p/harisx404");
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
  }
});

test("a failed blog cover retains its article link and placeholder", async (t) => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.route("**/_next/image?url=https%3A%2F%2F*", (route) => route.abort());
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    const writing = page.locator("main section").filter({ has: page.getByRole("heading", { name: "Latest write-ups." }) });
    await writing.waitFor();
    const article = writing.locator('a[href^="/blog/"]').first();
    const image = article.locator('img[src*="_next/image"]').first();
    if (!await image.count()) return t.skip("The published article has no remote cover");
    await image.scrollIntoViewIfNeeded();
    await image.waitFor({ state: "detached" });
    assert.equal(await article.isVisible(), true);
    assert.match(await article.getAttribute("href") || "", /^\/blog\//);
    assert.equal(await article.locator("h3").isVisible(), true);
  } finally {
    await browser.close();
  }
});
