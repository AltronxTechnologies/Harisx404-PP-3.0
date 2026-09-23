import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("Home and About live replacement cards remain responsive and aligned", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      for (const width of [320, 768, 1440]) {
        for (const route of ["/", "/about"]) {
          const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
          const errors = [];
          page.on("console", (message) => {
            if (message.type() === "error" && !/ERR_BLOCKED_BY_RESPONSE\.NotSameOrigin/.test(message.text())) {
              errors.push(message.text());
            }
          });
          page.on("pageerror", (error) => errors.push(error.message));
          await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
          const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
          assert.equal(response?.status(), 200);
          const result = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            githubCards: [...document.querySelectorAll("h3")].filter((heading) => heading.textContent === "GitHub activity").length,
            contributionCalendars: document.querySelectorAll("[data-github-contribution-calendar]").length,
            contributionCells: document.querySelectorAll("[data-github-contribution-calendar] > span").length,
            contributionFallbacks: [...document.querySelectorAll("div")].filter(
              (element) => element.textContent?.trim() === "Awaiting GitHub activity",
            ).length,
            credentialLinks: document.querySelectorAll("a[href='/credentials'] [data-credential-bento-preview]").length,
            statsLinks: document.querySelectorAll("a[href='/stats']").length,
            shortCards: [...document.querySelectorAll("[data-github-contribution-calendar]")].filter(
              (calendar) => calendar.getBoundingClientRect().height < 80,
            ).length,
          }));
          assert.equal(result.overflow, 0, `${route} ${theme} ${width}px overflow`);
          assert.equal(result.githubCards, 1, `${route} ${theme} ${width}px GitHub card`);
          assert.equal(result.contributionCalendars + result.contributionFallbacks, 1, `${route} ${theme} ${width}px contribution state`);
          if (result.contributionCalendars) {
            assert.ok(result.contributionCells >= 300, `${route} ${theme} ${width}px live contribution cells`);
          }
          assert.equal(result.credentialLinks, 1, `${route} ${theme} ${width}px credential card`);
          assert.equal(result.statsLinks, 0, `${route} ${theme} ${width}px retired Stats links`);
          assert.equal(result.shortCards, 0, `${route} ${theme} ${width}px chart geometry`);
          assert.deepEqual(errors, [], `${route} ${theme} ${width}px errors`);

          if (route === "/" && width === 1440) {
            await page.getByRole("button", { name: "More" }).hover();
            const panel = page.locator("#navbar-more-panel");
            await panel.waitFor();
            assert.equal(await panel.locator("a[href='/buildlog']").count(), 1);
            assert.equal(await panel.locator("a[href='/stats']").count(), 0);
          }
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
