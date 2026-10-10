import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("project image cards keep their geometry and independent captions across themes and phone layout", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/projects/medicalink-hms`, { waitUntil: "domcontentloaded" });
    const figure = page.getByRole("figure", { name: /^Image \d+ of 3$/ });
    await figure.waitFor();
    const pause = page.getByRole("button", { name: "Pause carousel" });
    if (await pause.count()) await pause.click();
    await page.getByRole("button", { name: "Go to image 1" }).click();
    await page.getByRole("figure", { name: "Image 1 of 3" }).waitFor();
    await page.waitForTimeout(600);

    const frame = figure.locator(":scope > div");
    for (const theme of ["dark", "light"]) {
      if (theme === "light") await page.getByRole("button", { name: "Switch to light mode" }).click();
      const cards = figure.locator('img:not([alt=""]):visible');
      assert.equal(await cards.count(), 2);
      const [left, right] = await Promise.all([cards.nth(0).locator("..").boundingBox(), cards.nth(1).locator("..").boundingBox()]);
      assert.ok(left && right);
      assert.ok(Math.abs(left.width / left.height - 1.5) < 0.01);
      assert.ok(Math.abs(right.width / right.height - 1.5) < 0.01);
      assert.ok(Math.abs(left.width - right.width) < 1 && Math.abs(left.height - right.height) < 1);
      assert.ok(Math.abs(right.x - left.x - left.width - 16) < 1, JSON.stringify({ left, right }));
      const surface = await frame.evaluate((node) => getComputedStyle(node).backgroundColor);
      assert.notEqual(surface, "rgba(0, 0, 0, 0)", `${theme} transition surface must be opaque`);
      const leftTrigger = page.getByRole("button", { name: "Show image 1 caption" });
      const rightTrigger = page.getByRole("button", { name: "Show image 2 caption" });
      const [leftButton, rightButton] = await Promise.all([leftTrigger.boundingBox(), rightTrigger.boundingBox()]);
      assert.ok(leftButton && rightButton);
      assert.ok(leftButton.x >= left.x && leftButton.x < left.x + left.width);
      assert.ok(rightButton.x >= right.x && rightButton.x < right.x + right.width);

      await leftTrigger.click();
      const leftCaption = page.getByRole("region", { name: "Image caption" });
      const firstText = await leftCaption.locator("p").innerText();
      assert.equal(await page.getByRole("button", { name: "Hide image 1 caption" }).getAttribute("aria-expanded"), "true");
      await rightTrigger.click();
      const secondText = await leftCaption.locator("p").innerText();
      assert.notEqual(firstText, secondText);
      assert.equal(await leftTrigger.getAttribute("aria-expanded"), "false");
      assert.equal(await page.getByRole("button", { name: "Hide image 2 caption" }).getAttribute("aria-expanded"), "true");
      const panel = await leftCaption.boundingBox();
      assert.ok(panel && panel.x >= right.x && panel.x + panel.width <= right.x + right.width);
      await page.keyboard.press("Escape");
      assert.equal(await leftCaption.count(), 0);
      assert.equal(await page.getByRole("button", { name: "Show image 2 caption" }).evaluate((node) => document.activeElement === node), true);
    }

    await page.getByRole("button", { name: "Next image" }).click();
    await page.getByRole("figure", { name: "Image 2 of 3" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Show image 3 caption" }).count(), 1);
    await page.getByRole("button", { name: "Show image 3 caption" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.getByRole("region", { name: "Image caption" }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Show image 3 caption" }).isVisible(), false);
    const mobileImage = await figure.locator('img:not([alt=""]):visible').first().boundingBox();
    assert.ok(mobileImage && Math.abs(mobileImage.width / mobileImage.height - 1.5) < 0.01);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
