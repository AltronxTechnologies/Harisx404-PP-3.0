import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog detail share controls use native keyboard behavior and accessible names", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${baseUrl}/blog/effective-use-of-beforeeach-and-aftereach-in-angular-unit-tests`);

    const copy = page.getByRole("button", { name: "Copy URL" });
    const more = page.getByRole("button", { name: "More share options" });
    await more.waitFor();
    for (const button of [copy, more]) {
      const box = await button.boundingBox();
      assert.ok(box.width >= 24 && box.height >= 24, `touch target ${box.width}x${box.height} is too small`);
    }

    await more.click();
    const group = page.getByRole("group", { name: "Share options" });
    await group.waitFor();
    assert.equal(await page.getByRole("menu").count(), 0);
    await more.focus();
    await page.keyboard.press("Tab");
    assert.equal(await group.getByRole("button", { name: "Copy link" }).evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press("Tab");
    assert.equal(await group.getByRole("button", { name: "Share on X" }).evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await group.count(), 0);
    assert.equal(await more.evaluate((node) => node === document.activeElement), true);

    await more.click();
    await group.getByRole("button", { name: "Copy link" }).click();
    await page.getByRole("button", { name: "Copied!" }).waitFor();
    await page.getByRole("status").getByText("Copied URL").waitFor();
    assert.equal(await group.count(), 0);
    assert.equal(await more.evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), page.url());

    await more.click();
    await page.locator("body").click({ position: { x: 2, y: 2 } });
    assert.equal(await group.count(), 0);

    const love = page.getByRole("button", { name: /Add Love \(heart\) reaction, \d+ reactions?/ });
    await love.waitFor();
    assert.equal(await love.getAttribute("aria-pressed"), "false");
    assert.match(await love.innerText(), /Love/);
  } finally {
    await browser.close();
  }
});
