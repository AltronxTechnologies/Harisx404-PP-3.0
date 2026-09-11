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
            invalidLinkLayouts: [...document.querySelectorAll("[data-project-links]")].filter(
              (group) => {
                const links = [...group.querySelectorAll("a")];
                if (links.length === 1) {
                  return Math.abs(links[0].getBoundingClientRect().width - group.getBoundingClientRect().width) > 1;
                }
                return links.length === 2 && Math.abs(
                  links[0].getBoundingClientRect().width - links[1].getBoundingClientRect().width,
                ) > 1;
              },
            ).length,
            emptyLinkContainers: [...document.querySelectorAll("article")].filter(
              (article) =>
                article.querySelectorAll("a[target='_blank']").length === 0 &&
                article.querySelector("[data-project-links]"),
            ).length,
          };
        });
        assert.equal(initial.overflow, 0, `${theme} ${width}px overflow`);
        assert.ok(initial.articles > 0, `${theme} ${width}px has projects`);
        assert.equal(initial.duplicateIds, 0, `${theme} ${width}px duplicate IDs`);
        assert.equal(initial.insecureLinks, 0, `${theme} ${width}px external-link security`);
        assert.equal(initial.invalidLinkLayouts, 0, `${theme} ${width}px project-link layout`);
        assert.equal(initial.emptyLinkContainers, 0, `${theme} ${width}px empty project-link containers`);
        assert.deepEqual(errors, [], `${theme} ${width}px console errors`);

        let disclosures = page.locator("button[aria-controls^='buildlog-shipped']");
        assert.ok((await disclosures.count()) > 0, `${theme} ${width}px disclosures exist`);
        const firstDisclosure = disclosures.nth(0);
        const disclosureTop = await firstDisclosure.evaluate(
          (element) => element.getBoundingClientRect().top + window.scrollY,
        );
        const controlledId = await firstDisclosure.getAttribute("aria-controls");
        await firstDisclosure.click();
        await page.waitForTimeout(200);
        assert.equal(await page.locator("button[aria-expanded='true']").count(), 1);
        assert.ok((await page.locator("article li").count()) > initial.items);
        assert.equal(
          await firstDisclosure.evaluate(
            (element) => element.getBoundingClientRect().top + window.scrollY,
          ),
          disclosureTop,
          `${theme} ${width}px disclosure position remains stable`,
        );
        assert.ok(controlledId);
        const disclosureBottom = await firstDisclosure.evaluate(
          (element) => element.getBoundingClientRect().bottom + window.scrollY,
        );
        const shippedTop = await page.locator(`#${controlledId}`).evaluate(
          (element) => element.getBoundingClientRect().top + window.scrollY,
        );
        assert.ok(shippedTop >= disclosureBottom - 1, `${theme} ${width}px shipped rows open below control`);
        await firstDisclosure.click();
        await page.waitForTimeout(200);
        assert.equal(await firstDisclosure.getAttribute("aria-expanded"), "false");
        assert.equal(
          await firstDisclosure.evaluate(
            (element) => element.getBoundingClientRect().top + window.scrollY,
          ),
          disclosureTop,
          `${theme} ${width}px close control position remains stable`,
        );
        await firstDisclosure.click();
        await page.waitForTimeout(200);

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
