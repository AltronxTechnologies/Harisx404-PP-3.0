import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.COMMUNITY_WALL_BASE_URL || "http://localhost:3000";

test("Community Wall empty state and anonymous invitation remain contained at additional widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      try {
        const response = await page.goto(`${baseUrl}/community-wall`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.getByRole("button", { name: "Write a message..." }).waitFor();
        for (const width of [375, 430, 640, 1280, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const section = document.querySelector('section[aria-labelledby="community-wall-heading"]');
            const invite = section.querySelector("article").getBoundingClientRect();
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              h1: document.querySelectorAll("main h1").length,
              count: section.querySelector("h2").nextElementSibling.textContent.trim(),
              invite: { left: invite.left, right: invite.right, width: invite.width },
              empty: section.textContent.includes("The first note is waiting"),
            };
          });
          assert.equal(state.theme, theme, `${width}: theme`);
          assert.ok(state.overflow <= 1, `${width}: ${state.overflow}px overflow`);
          assert.equal(state.h1, 1);
          assert.match(state.count, /00 messages/);
          assert.ok(state.empty && state.invite.width >= 250 && state.invite.left >= 0 && state.invite.right <= width + 1);
        }
        assert.match(await page.title(), /^Community Wall \| Leave Your Mark \|/);
        assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/community-wall$/);
        assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("anonymous touch dialog and sign-in error remain accessible without submission", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/community-wall`, { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "Write a message..." });
    await trigger.tap();
    const dialog = page.getByRole("dialog", { name: "Leave your mark" });
    await dialog.waitFor();
    for (const provider of ["GitHub", "Google"]) {
      const link = dialog.getByRole("link", { name: `Continue with ${provider}` });
      assert.match(await link.getAttribute("href"), new RegExp(`^/auth/${provider.toLowerCase()}$`));
    }
    assert.match(await dialog.innerText(), /Notes appear only after Admin approval/);
    const close = dialog.getByRole("button", { name: "Close Community Wall dialog" });
    await close.tap();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);

    await page.goto(`${baseUrl}/community-wall?auth=error`, { waitUntil: "domcontentloaded" });
    const errorDialog = page.getByRole("dialog", { name: "Leave your mark" });
    await errorDialog.waitFor();
    assert.match(await errorDialog.getByRole("alert").innerText(), /sign-in was not completed/);
    await page.keyboard.press("Escape");
    await errorDialog.waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("button", { name: "Write a message..." }).evaluate((node) => document.activeElement === node), true);

    await page.goto(`${baseUrl}/community-wall?page=999`, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname === "/community-wall" && !url.searchParams.has("page"));
    await page.getByRole("button", { name: "Write a message..." }).waitFor();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        title: document.querySelector("main h1").getBoundingClientRect(),
        trigger: document.querySelector('button[type="button"]').getBoundingClientRect(),
      }));
      assert.ok(state.overflow <= 1, `${width} with 200% text: ${state.overflow}px overflow`);
      assert.ok(state.title.left >= 0 && state.title.right <= width + 1);
    }
  } finally {
    await browser.close();
  }
});
