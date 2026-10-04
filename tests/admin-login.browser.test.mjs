import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL || "http://localhost:3000";

test("Admin login retains readable controls at phone, tablet and desktop widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${baseUrl}/admin/login`);
        await page.getByRole("heading", { name: "Admin Portal" }).waitFor();
        for (const width of [320, 375, 390, 640, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const form = document.querySelector("main form");
            const fields = [...form.querySelectorAll('input[type="email"], input[type="password"]')];
            const button = form.querySelector('button[type="submit"]');
            const card = form.parentElement;
            const box = card.getBoundingClientRect();
            return {
              dark: document.documentElement.classList.contains("dark"),
              adminDark: document.querySelector("[data-admin-root]").classList.contains("dark"),
              adminBackground: getComputedStyle(document.querySelector("[data-admin-root]")).backgroundColor,
              adminText: getComputedStyle(document.querySelector("[data-admin-root]")).color,
              buttonBackground: getComputedStyle(button).backgroundColor,
              overflow: document.documentElement.scrollWidth - innerWidth,
              headingCount: document.querySelectorAll("main h1").length,
              namedFields: fields.map((field) => field.labels?.[0]?.textContent?.trim()),
              fieldHeights: fields.map((field) => field.getBoundingClientRect().height),
              buttonHeight: button.getBoundingClientRect().height,
              cardFits: box.left >= 0 && box.right <= innerWidth,
              noindex: document.querySelector('meta[name="robots"]')?.content,
            };
          });
          assert.equal(state.dark, theme === "dark", `${theme} ${width}px theme`);
          assert.equal(state.adminDark, true, `${theme} ${width}px fixed Admin theme`);
          assert.equal(state.adminBackground, "rgb(13, 13, 15)");
          assert.equal(state.adminText, "rgb(250, 250, 250)");
          assert.equal(state.buttonBackground, "rgb(250, 250, 250)");
          assert.ok(state.overflow <= 1, `${theme} ${width}px overflow`);
          assert.equal(state.headingCount, 1);
          assert.deepEqual(state.namedFields, ["Email address", "Password"]);
          assert.ok(state.fieldHeights.every((height) => height >= 44));
          assert.ok(state.buttonHeight >= 48);
          assert.equal(state.cardFits, true);
          assert.match(state.noindex, /noindex/);
        }
        const controls = await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.className = "admin-content";
          probe.innerHTML = '<section class="rounded-xl border border-border-hairline bg-surface-raised shadow-sm"><input aria-label="Sample title"><select aria-label="Sample status"><option>Draft</option></select><button class="bg-accent-signal text-white">Save</button></section>';
          document.querySelector("[data-admin-root]").append(probe);
          const [card, input, select, button] = [probe.querySelector("section"), probe.querySelector("input"), probe.querySelector("select"), probe.querySelector("button")];
          const result = {
            card: getComputedStyle(card).backgroundColor,
            input: getComputedStyle(input).backgroundColor,
            inputBorder: getComputedStyle(input).borderColor,
            selectHeight: select.getBoundingClientRect().height,
            selectArrow: getComputedStyle(select).backgroundImage,
            button: getComputedStyle(button).backgroundColor,
            buttonText: getComputedStyle(button).color,
          };
          probe.remove();
          return result;
        });
        assert.equal(controls.card, "rgb(27, 27, 31)");
        assert.equal(controls.input, "rgb(19, 19, 22)");
        assert.equal(controls.inputBorder, "rgb(114, 116, 126)");
        assert.ok(controls.selectHeight >= 44);
        assert.match(controls.selectArrow, /data:image\/svg/);
        assert.equal(controls.button, "rgb(250, 250, 250)");
        assert.equal(controls.buttonText, "rgb(13, 13, 15)");
        assert.deepEqual(errors, [], `${theme} runtime errors`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
