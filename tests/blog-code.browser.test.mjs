import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog code can be copied by touch and long lines scroll inside the window", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const window = page.locator("#blog-article pre").first();
    await window.waitFor({ state: "visible" });
    const code = await window.locator("code").textContent();
    const copy = window.locator("..").getByRole("button", { name: "Copy code" });
    await copy.tap();
    await page.getByRole("button", { name: "Code copied" }).waitFor();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(clipboard.trimEnd(), code.trimEnd());
    assert.ok(clipboard.endsWith("\n"), "copy preserves the source trailing newline");

    const widths = await page.evaluate(() => {
      const pre = document.querySelector("#blog-article pre");
      pre.querySelector("code").textContent = "long-identifier".repeat(100);
      const header = pre.previousElementSibling;
      const button = header.querySelector("button");
      pre.scrollLeft = 80;
      return {
        inner: pre.clientWidth,
        scroll: pre.scrollWidth,
        scrollLeft: pre.scrollLeft,
        scrollbarWidth: getComputedStyle(pre).scrollbarWidth,
        scrollbarColor: getComputedStyle(pre).scrollbarColor,
        headerHeight: header.getBoundingClientRect().height,
        buttonHeight: button.getBoundingClientRect().height,
        codeSize: getComputedStyle(pre.querySelector("code")).fontSize,
        page: document.documentElement.scrollWidth,
        viewport: innerWidth,
      };
    });
    assert.ok(widths.scroll > widths.inner, "long lines must scroll in the code window");
    assert.ok(widths.scrollLeft > 0, "the horizontal code scrollbar moves the content");
    assert.equal(widths.scrollbarWidth, "thin");
    assert.notEqual(widths.scrollbarColor, "auto");
    assert.ok(widths.headerHeight <= 48 && widths.buttonHeight >= 32 && widths.buttonHeight < 36);
    assert.equal(widths.codeSize, "12.5px");
    assert.ok(widths.page <= widths.viewport + 1, "code must not widen the page");

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await page.locator('nav[aria-label="Table of contents"] button').first().tap();
    await page.getByRole("button", { name: "Close table of contents" }).waitFor();
  } finally {
    await browser.close();
  }
});

test("Blog code copy failure is visible as well as announced", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const copy = page.getByRole("button", { name: "Copy code" }).first();
    await copy.waitFor();
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, "writeText", {
        configurable: true,
        value: async () => { throw new Error("Clipboard blocked"); },
      });
    });
    await copy.click();
    const failed = page.getByRole("button", { name: "Copy failed" }).first();
    await failed.waitFor();
    assert.equal(await failed.innerText(), "Copy failed");
    await page.getByRole("status").getByText("Could not copy code").first().waitFor();
  } finally {
    await browser.close();
  }
});
