import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.COMMUNITY_WALL_BASE_URL || "http://localhost:3000";
const widths = [320, 360, 390, 768, 1024, 1440];

test("Community Wall remains aligned and accessible across themes and widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
        const errors = [];
        page.on("console", (message) => {
          if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        const response = await page.goto(`${baseUrl}/community-wall`, { waitUntil: "networkidle" });
        assert.equal(response?.status(), 200);
        const result = await page.evaluate(() => {
          const section = document.querySelector("section[aria-labelledby='community-wall-heading']");
          const cards = section ? [...section.querySelectorAll(":scope > div.grid > *")] : [];
          const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
          const footer = document.querySelector("body > div footer, body footer");
          const ctaKicker = [...document.querySelectorAll("p")].find(
            (element) => element.textContent?.trim() === "Available for opportunities",
          );
          const cta = ctaKicker?.closest("section");
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            h1Count: document.querySelectorAll("h1").length,
            duplicateIds: ids.length - new Set(ids).size,
            cards: cards.length,
            narrowCards: cards.filter((card) => card.getBoundingClientRect().width < 250).length,
            shortCards: cards.filter((card) => card.getBoundingClientRect().height < 220).length,
            ctaFooterGap: footer && cta
              ? Math.abs(footer.getBoundingClientRect().top - cta.getBoundingClientRect().bottom)
              : Number.POSITIVE_INFINITY,
            buttonHeight: document.querySelector("article a, article button")?.getBoundingClientRect().height || 0,
            extraContentInfo: document.querySelectorAll("footer").length,
            ogTitle: document.querySelector("meta[property='og:title']")?.getAttribute("content"),
            twitterTitle: document.querySelector("meta[name='twitter:title']")?.getAttribute("content"),
          };
        });
        assert.equal(result.overflow, 0, `${theme} ${width}px overflow`);
        assert.equal(result.h1Count, 1, `${theme} ${width}px H1 count`);
        assert.equal(result.duplicateIds, 0, `${theme} ${width}px duplicate IDs`);
        assert.ok(result.cards > 0, `${theme} ${width}px cards`);
        assert.equal(result.narrowCards, 0, `${theme} ${width}px card widths`);
        assert.equal(result.shortCards, 0, `${theme} ${width}px card heights`);
        assert.ok(result.ctaFooterGap <= 0.5, `${theme} ${width}px CTA/Footer handoff`);
        assert.ok(result.buttonHeight >= 36, `${theme} ${width}px card trigger height`);
        assert.equal(result.extraContentInfo, 1, `${theme} ${width}px footer landmarks`);
        assert.match(result.ogTitle || "", /Community Wall/i);
        assert.match(result.twitterTitle || "", /Community Wall/i);
        if (theme === "light" && width === 320) {
          await page.getByRole("button", { name: "Write a message..." }).click();
          const dialog = page.getByRole("dialog", { name: "Leave your mark" });
          await dialog.waitFor();
          const box = await dialog.boundingBox();
          assert.ok(box && box.width <= 400 && box.width <= width - 32, "mobile dialog width");
          assert.equal(await page.locator("body").evaluate((body) => getComputedStyle(body).overflow), "hidden");
          assert.equal(
            await page.locator("main").evaluate((element) => Boolean(element.closest("[inert]"))),
            true,
            "dialog inerts background application content",
          );
          assert.equal(
            await page.locator("[data-community-wall-modal][aria-hidden='true']").evaluate(
              (element) => element.tagName,
            ),
            "DIV",
            "backdrop is not a focusable button",
          );
          assert.ok(await dialog.getByRole("link", { name: /Continue with GitHub/i }).isVisible());
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          assert.equal(
            await page.getByRole("button", { name: "Write a message..." }).evaluate(
              (element) => document.activeElement === element,
            ),
            true,
            "Escape restores focus to the dialog trigger",
          );
          assert.equal(
            await page.locator("main").evaluate((element) => Boolean(element.closest("[inert]"))),
            false,
            "dialog restores background application content",
          );
        }
        assert.deepEqual(errors, [], `${theme} ${width}px console warnings/errors`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
