import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BUILDLOG_BASE_URL || "http://localhost:3000";
const widths = [320, 360, 375, 390, 768, 1024, 1440];

test("Buildlog lifecycle and shipped disclosures work across themes and widths", async () => {
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
            releaseSummaryInset: (() => {
              const section = document.querySelector("section[aria-labelledby='buildlog-collection-heading']");
              const summary = document.querySelector("[data-release-summary]");
              if (!section || !summary) return Number.POSITIVE_INFINITY;
              const sectionRect = section.getBoundingClientRect();
              const summaryRect = summary.getBoundingClientRect();
              return Math.max(
                Math.abs(sectionRect.left - summaryRect.left),
                Math.abs(sectionRect.right - summaryRect.right),
              );
            })(),
            invalidReleaseSummary: (() => {
              const summary = document.querySelector("[data-release-summary]");
              if (!summary) return true;
              const summaryStyle = getComputedStyle(summary);
              const metrics = summary.querySelectorAll(":scope > div > p");
              const separator = summary.querySelector(":scope > div > span[aria-hidden='true']");
              const separatorRect = separator?.getBoundingClientRect();
              return (
                summaryStyle.borderTopWidth !== "0px" ||
                summaryStyle.borderBottomWidth !== "0px" ||
                metrics.length !== 2 ||
                !separatorRect ||
                Math.abs(separatorRect.width - 1) > 0.5 ||
                Math.abs(separatorRect.height - 16) > 0.5
              );
            })(),
            lifecycleLabels: [...document.querySelectorAll("article header")].filter(
              (header) => /In progress|Live|Completed/.test(header.textContent || ""),
            ).length,
            misalignedReleaseContent: [...document.querySelectorAll("article li")].filter(
              (row) => {
                const rowRect = row.getBoundingClientRect();
                const markRect = row.querySelector("[data-release-state-mark]")?.getBoundingClientRect();
                const contentRect = row.querySelector("[data-release-content]")?.getBoundingClientRect();
                if (!markRect || !contentRect) return true;
                const rowCenter = rowRect.top + rowRect.height / 2;
                return (
                  Math.abs(markRect.top + markRect.height / 2 - rowCenter) > 1 ||
                  Math.abs(contentRect.top + contentRect.height / 2 - rowCenter) > 1
                );
              },
            ).length,
            misalignedLedgerRows:
              window.innerWidth < 1024
                ? 0
                : [...document.querySelectorAll("article")].filter((article) => {
                    const left = article.querySelector("[data-project-status-row]")?.getBoundingClientRect();
                    const right = article.querySelector("[data-release-top-row]")?.getBoundingClientRect();
                    return (
                      !left ||
                      !right ||
                      Math.abs(left.top - right.top) > 0.5 ||
                      Math.abs(left.bottom - right.bottom) > 0.5
                    );
                  }).length,
            invalidProjectBoundaries: [...document.querySelectorAll("[data-project-boundary]")].filter(
              (article) =>
                Math.abs(Number.parseFloat(getComputedStyle(article, "::before").height) - 1.5) > 0.1,
            ).length,
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
            wrappedProjectLinks: externalLinks.filter(
              (link) =>
                getComputedStyle(link).whiteSpace !== "nowrap" ||
                link.scrollWidth > link.clientWidth + 1,
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
        assert.ok(initial.releaseSummaryInset <= 0.5, `${theme} ${width}px release summary width`);
        assert.equal(initial.invalidReleaseSummary, false, `${theme} ${width}px release summary`);
        assert.equal(initial.lifecycleLabels, initial.articles, `${theme} ${width}px lifecycle labels`);
        assert.equal(initial.misalignedReleaseContent, 0, `${theme} ${width}px release content alignment`);
        assert.equal(initial.misalignedLedgerRows, 0, `${theme} ${width}px ledger row alignment`);
        assert.equal(initial.invalidProjectBoundaries, 0, `${theme} ${width}px project boundaries`);
        assert.equal(initial.duplicateIds, 0, `${theme} ${width}px duplicate IDs`);
        assert.equal(initial.insecureLinks, 0, `${theme} ${width}px external-link security`);
        assert.equal(initial.invalidLinkLayouts, 0, `${theme} ${width}px project-link layout`);
        assert.equal(initial.wrappedProjectLinks, 0, `${theme} ${width}px project-link wrapping`);
        assert.equal(initial.emptyLinkContainers, 0, `${theme} ${width}px empty project-link containers`);
        assert.deepEqual(errors, [], `${theme} ${width}px console errors`);

        let disclosures = page.locator("button[aria-controls^='buildlog-shipped']");
        assert.ok((await disclosures.count()) > 0, `${theme} ${width}px disclosures exist`);
        const firstDisclosure = disclosures.nth(0);
        const disclosureTop = await firstDisclosure.evaluate(
          (element) => element.getBoundingClientRect().top + window.scrollY,
        );
        const controlledId = await firstDisclosure.getAttribute("aria-controls");
        assert.equal(await firstDisclosure.locator("[data-shipped-label-group] [data-project-version]").count(), 1);
        await firstDisclosure.click();
        await page.waitForTimeout(200);
        assert.equal(await page.locator("button[aria-expanded='true']").count(), 1);
        assert.ok((await page.locator("article li").count()) > initial.items);
        assert.ok(
          (await page.getByText(/Demo: shipped update preview/).count()) > 0,
        );
        assert.match(await firstDisclosure.textContent(), /Hide shipped updates\s*·\s*06\s*v2\.1/i);
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
        const shippedList = page.locator(`#${controlledId} ol`);
        const scrollMetrics = await shippedList.evaluate((element) => ({
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          rowHeights: [...element.children]
            .slice(0, 3)
            .map((child) => child.getBoundingClientRect().height),
        }));
        assert.ok(scrollMetrics.scrollHeight > scrollMetrics.clientHeight);
        assert.ok(
          Math.abs(
            scrollMetrics.rowHeights.reduce((sum, height) => sum + height, 0) -
              scrollMetrics.clientHeight,
          ) <= 1,
          `${theme} ${width}px shows exactly three shipped rows`,
        );
        if (theme === "light" && width === 360) {
          await shippedList.evaluate((element) => {
            element.scrollTop = element.scrollHeight;
          });
          const listBox = await shippedList.boundingBox();
          assert.ok(listBox);
          const pageScrollBefore = await page.evaluate(() => window.scrollY);
          await page.mouse.move(listBox.x + listBox.width / 2, listBox.y + listBox.height / 2);
          await page.mouse.wheel(0, 500);
          await page.waitForTimeout(150);
          assert.ok(
            (await page.evaluate(() => window.scrollY)) > pageScrollBefore,
            "page scroll resumes when shipped list reaches its end",
          );
        }
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

        assert.equal(await page.locator("[aria-label='Filter Buildlog projects']").count(), 0);

        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
