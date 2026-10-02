import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("Blog and Project detail CTA handoffs match the locked About page", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext();
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        for (const [route, contentSelector] of [
          ["/about", ""],
          ["/blog/build-link-previews-with-playwright-and-the-popover-api", '[aria-labelledby="related-articles-heading"] .grid'],
          ["/projects/intrushield-nids", '[aria-labelledby="related-projects-heading"] .grid'],
        ]) {
          await page.goto(`${baseUrl}${route}`);
          await page.getByRole("heading", { name: /From concept to creation/ }).first().waitFor();
          if (contentSelector) await page.locator(contentSelector).waitFor();
          await page.locator("footer").waitFor();
          for (const width of [320, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            const state = await page.evaluate((selector) => {
              const ctaHeading = [...document.querySelectorAll("h2")].find((heading) => heading.textContent.includes("From concept to creation"));
              const cta = ctaHeading.closest("section");
              const preceding = selector ? document.querySelector(selector) : cta.previousElementSibling;
              const kicker = cta.querySelector("p");
              return {
                gap: kicker.getBoundingClientRect().top - preceding.getBoundingClientRect().bottom,
                footerGap: document.querySelector("footer").getBoundingClientRect().top - cta.getBoundingClientRect().bottom,
              };
            }, contentSelector);
            assert.deepEqual(state, { gap: width >= 768 ? 144 : 136, footerGap: 0 }, `${route} ${theme} ${width}px handoff`);
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
