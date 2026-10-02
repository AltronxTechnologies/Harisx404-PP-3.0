import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("failed reaction requests restore the original choice and count without a database write", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const buttons = page.locator('[aria-labelledby="article-reactions-heading"] button');
    await buttons.first().waitFor({ state: "visible" });
    await page.waitForFunction(() => [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')].every((button) => !button.disabled));
    const before = await buttons.evaluateAll((items) => items.map((button) => ({
      label: button.getAttribute("aria-label"),
      pressed: button.getAttribute("aria-pressed"),
    })));

    let intercepted = false;
    await page.route("**/blog/the-only-nextjs-favicon-guide-youll-need", async (route) => {
      if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
        intercepted = true;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await buttons.first().click();
    await page.getByRole("alert").getByText("We couldn't save your reaction. Please try again.").waitFor();
    assert.equal(intercepted, true, "server action was blocked before reaching the database");
    assert.deepEqual(await buttons.evaluateAll((items) => items.map((button) => ({
      label: button.getAttribute("aria-label"),
      pressed: button.getAttribute("aria-pressed"),
    }))), before);
    assert.equal(await buttons.first().isEnabled(), true, "visitor can retry after failure");
  } finally {
    await browser.close();
  }
});
