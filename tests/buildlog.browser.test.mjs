import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BUILDLOG_BASE_URL || "http://localhost:3000";
const widths = [320, 360, 375, 390, 768, 1024, 1440];

test("Buildlog filtering and shipped disclosures work across themes and widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      for (const width of widths) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          colorScheme: theme,
        });
        const errors = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        await page.goto(`${baseUrl}/buildlog`, { waitUntil: "networkidle" });

        const initial = await page.evaluate(() => {
          const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
          const externalLinks = [...document.querySelectorAll("article a[target='_blank']")];
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            articles: document.querySelectorAll("article").length,
            items: document.querySelectorAll("article li").length,
            duplicateIds: ids.length - new Set(ids).size,
            insecureLinks: externalLinks.filter(
              (link) => link.getAttribute("rel") !== "noopener noreferrer",
            ).length,
          };
        });
        assert.equal(initial.overflow, 0, `${theme} ${width}px overflow`);
        assert.ok(initial.articles > 0, `${theme} ${width}px has projects`);
        assert.equal(initial.duplicateIds, 0, `${theme} ${width}px duplicate IDs`);
        assert.equal(initial.insecureLinks, 0, `${theme} ${width}px external-link security`);
        assert.deepEqual(errors, [], `${theme} ${width}px console errors`);

        let disclosures = page.locator("button[aria-controls^='buildlog-shipped']");
        assert.ok((await disclosures.count()) > 0, `${theme} ${width}px disclosures exist`);
        await disclosures.nth(0).click();
        await page.waitForTimeout(200);
        assert.equal(await page.locator("button[aria-expanded='true']").count(), 1);
        assert.ok((await page.locator("article li").count()) > initial.items);

        if ((await disclosures.count()) > 1) {
          disclosures = page.locator("button[aria-controls^='buildlog-shipped']");
          await disclosures.nth(1).click();
          await page.waitForTimeout(200);
          assert.equal(await page.locator("button[aria-expanded='true']").count(), 1);
          await page.goBack();
          await page.waitForTimeout(200);
          assert.equal(await page.locator("button[aria-expanded='true']").count(), 1);
        }

        await page.getByRole("button", { name: /^Completed/ }).click();
        await page.waitForTimeout(200);
        assert.match(page.url(), /filter=completed/);
        assert.equal(
          await page.getByRole("button", { name: /^Completed/ }).getAttribute("aria-pressed"),
          "true",
        );
        await page.getByRole("button", { name: /^All/ }).click();
        await page.waitForTimeout(200);
        assert.equal(await page.locator("article").count(), initial.articles);

        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
