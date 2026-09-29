import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";
const articleUrl = `${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`;

test("article image lightbox supports keyboard, focus containment and restoration", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(articleUrl, { waitUntil: "networkidle" });
    const image = page.locator("#blog-article img:not(a img)").first();
    await image.waitFor();
    assert.equal(await image.getAttribute("role"), "button");
    assert.equal(await image.getAttribute("tabindex"), "0");
    assert.match(await image.getAttribute("aria-label"), /^Zoom image: /);
    await page.evaluate(() => { document.body.style.overflow = "scroll"; });

    await image.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const close = dialog.getByRole("button", { name: "Close image" });
    await close.waitFor();
    assert.equal(await close.evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await page.keyboard.press("Tab");
    assert.equal(await close.evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await close.evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await image.evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "scroll");

    await image.click();
    await dialog.waitFor();
    await close.click();
    await dialog.waitFor({ state: "detached" });
    assert.equal(await image.evaluate((element) => element === document.activeElement), true);

    await page.keyboard.press("Space");
    await dialog.waitFor();
    await dialog.locator("img").click();
    assert.equal(await dialog.count(), 1, "clicking the enlarged image does not dismiss it");
    await dialog.click({ position: { x: 2, y: 2 } });
    await dialog.waitFor({ state: "detached" });
    assert.equal(await image.evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "scroll");

    // Linked article images keep native link behavior, including keyboard activation.
    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "#linked-image-test";
      const img = document.createElement("img");
      img.src = "/blog/favicon_for_app.jpeg";
      img.alt = "Linked image";
      link.append(img);
      document.getElementById("blog-article").append(link);
    });
    const link = page.locator('#blog-article a[href="#linked-image-test"]');
    assert.equal(await link.locator("img").getAttribute("role"), null);
    assert.equal(await link.locator("img").getAttribute("tabindex"), null);
    await link.focus();
    await page.keyboard.press("Enter");
    assert.equal(new URL(page.url()).hash, "#linked-image-test");
    assert.equal(await dialog.count(), 0);
    await page.evaluate(() => history.replaceState(null, "", location.pathname));
    await link.locator("img").click();
    assert.equal(new URL(page.url()).hash, "#linked-image-test");
    assert.equal(await dialog.count(), 0);

    await image.focus();
    await page.keyboard.press("Enter");
    await dialog.waitFor();
    await page.locator('header a[href="/blog"]').first().evaluate((element) => element.click());
    await page.waitForURL(`${baseUrl}/blog`);
    await page.waitForFunction(() => document.body.style.overflow !== "hidden");
    assert.equal(await page.evaluate(() => document.body.style.overflow), "scroll", "unmount restores prior overflow");
  } finally {
    await browser.close();
  }
});

test("reduced-motion lightbox closes without animation and returns focus", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await page.goto(articleUrl, { waitUntil: "networkidle" });
    const image = page.locator("#blog-article img:not(a img)").first();
    await image.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await dialog.evaluate((element) => getComputedStyle(element).transitionProperty), "none");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await image.evaluate((element) => element === document.activeElement), true);
  } finally {
    await browser.close();
  }
});
