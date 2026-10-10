import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.CONTACT_BASE_URL || "http://localhost:3000";

test("Contact form and availability card fit phone to desktop in both themes", async () => {
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
        const response = await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.getByRole("button", { name: "Send message", exact: true }).waitFor();
        for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const region = document.querySelector('section[aria-label="Send a message"]');
            const aside = region.querySelector("aside").getBoundingClientRect();
            const formCard = region.querySelector(":scope > div > div").getBoundingClientRect();
            const controls = [...region.querySelectorAll("form input:not([name=website]), form textarea, form button[type=submit]")].map((element) => element.getBoundingClientRect());
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              h1: document.querySelectorAll("main h1").length,
              aside: { left: aside.left, right: aside.right },
              form: { left: formCard.left, right: formCard.right },
              controls: controls.map((box) => ({ left: box.left, right: box.right, height: box.height })),
            };
          });
          assert.equal(state.theme, theme);
          assert.ok(state.overflow <= 1, `${theme} ${width}: ${state.overflow}px overflow`);
          assert.equal(state.h1, 1);
          assert.ok(state.aside.left >= 0 && state.aside.right <= width + 1 && state.form.left >= 0 && state.form.right <= width + 1, `${theme} ${width}: ${JSON.stringify({ aside: state.aside, form: state.form })}`);
          assert.ok(state.controls.every((box) => box.left >= 0 && box.right <= width + 1 && box.height >= 44), `${theme} ${width}: form control containment`);
        }
        assert.deepEqual(errors, [], `${theme}: console/page errors`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Contact invalid submit announces field errors without storing or delivering a message", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
    const form = page.locator('section[aria-label="Send a message"] form');
    await form.waitFor();
    const type = page.getByRole("button", { name: "Project inquiry" });
    await type.click();
    await page.getByRole("option", { name: /Security report/ }).click();
    assert.match(await page.getByRole("button", { name: "Security report" }).innerText(), /Security report/);
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: /Please fix the highlighted fields/ }).waitFor();
    for (const name of ["Name", "Email", "Subject"]) {
      assert.equal(await page.getByRole("textbox", { name }).getAttribute("aria-invalid"), "true");
    }
    assert.equal(await form.locator("textarea").getAttribute("aria-invalid"), "true");
    assert.equal(await page.getByRole("heading", { name: "Thanks for reaching out." }).count(), 0);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/contact$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
  } finally {
    await browser.close();
  }
});

test("Contact remains reachable by touch and with enlarged text", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Project inquiry" }).tap();
    await page.getByRole("option", { name: /General question/ }).tap();
    assert.ok(await page.getByRole("button", { name: "General question" }).isVisible());
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => {
        const region = document.querySelector('section[aria-label="Send a message"]');
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          aside: region.querySelector("aside").getBoundingClientRect(),
          form: region.querySelector(":scope > div > div").getBoundingClientRect(),
        };
      });
      assert.ok(state.overflow <= 1, `${width} at 200% root text: ${state.overflow}px overflow`);
      assert.ok(state.aside.left >= 0 && state.aside.right <= width + 1 && state.form.left >= 0 && state.form.right <= width + 1, `${width}: ${JSON.stringify({ aside: state.aside, form: state.form })}`);
    }
  } finally {
    await browser.close();
  }
});
