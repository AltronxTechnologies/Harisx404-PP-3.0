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
          await page.waitForFunction(() => {
            const calendar = document.querySelector("[data-github-contribution-calendar]");
            const cells = [...(calendar?.querySelectorAll("button") || [])];
            if (!calendar || cells.length === 0) return true;
            const calendarRect = calendar.getBoundingClientRect();
            const first = cells[0].getBoundingClientRect();
            const last = cells[cells.length - 1].getBoundingClientRect();
            const remainder = calendarRect.width - (last.right - first.left);
            return remainder >= 0 && remainder < 18;
          });
          const result = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            githubCards: [...document.querySelectorAll("h3")].filter((heading) => heading.textContent?.startsWith("GitHub activity")).length,
            githubInlineHeaders: [...document.querySelectorAll("h3")].filter(
              (heading) =>
                heading.textContent?.startsWith("GitHub activity") &&
                /Live|Cached|Unavailable/.test(heading.parentElement?.textContent || ""),
            ).length,
            githubTotals: document.querySelectorAll("[data-github-total]").length,
            githubTotalLabels: [...document.querySelectorAll("[data-github-total]")].filter((total) =>
              /^[\d,]+ contributions$/.test(total.textContent?.trim() || ""),
            ).length,
            githubTypographyMatches: (() => {
              const githubHeading = [...document.querySelectorAll("h3")].find((heading) =>
                heading.textContent?.startsWith("GitHub activity"),
              );
              const siblingHeading = [...document.querySelectorAll("h3")].find(
                (heading) => heading.textContent === "Learn more about me",
              );
              if (!githubHeading || !siblingHeading) return false;
              const headingA = getComputedStyle(githubHeading);
              const headingB = getComputedStyle(siblingHeading);
              return (
                headingA.fontSize === headingB.fontSize &&
                headingA.fontWeight === headingB.fontWeight &&
                headingA.lineHeight === headingB.lineHeight
              );
            })(),
            githubLegends: document.querySelectorAll("[aria-label='Contribution intensity from less to high']").length,
            contributionCalendars: document.querySelectorAll("[data-github-contribution-calendar]").length,
            contributionCells: document.querySelectorAll("[data-github-contribution-calendar] > button").length,
            visibleContributionCells: [...document.querySelectorAll("[data-github-contribution-calendar] > button")].filter(
              (cell) => cell.getClientRects().length > 0,
            ).length,
            contributionWeeks: new Set(
              [...document.querySelectorAll("[data-github-contribution-calendar] > button")]
                .filter((cell) => cell.getClientRects().length > 0)
                .map((cell) => Math.round(cell.getBoundingClientRect().x)),
            ).size,
            contributionCellSizes: [...document.querySelectorAll("[data-github-contribution-calendar] > button")]
              .filter((cell) => cell.getClientRects().length > 0)
              .map((cell) => cell.getBoundingClientRect().width),
            contributionHorizontalRemainder: (() => {
              const calendar = document.querySelector("[data-github-contribution-calendar]");
              const cells = [...(calendar?.querySelectorAll("button") || [])].filter(
                (cell) => cell.getClientRects().length > 0,
              );
              if (!calendar || cells.length === 0) return Infinity;
              const calendarRect = calendar.getBoundingClientRect();
              const first = cells[0].getBoundingClientRect();
              const last = cells[cells.length - 1].getBoundingClientRect();
              return calendarRect.width - (last.right - first.left);
            })(),
            contributionTabStops: document.querySelectorAll("[data-github-contribution-calendar] > button[tabindex='0']").length,
            contributionLabels: [...document.querySelectorAll("[data-github-contribution-calendar] > button")].filter(
              (cell) => /contributions? on [A-Z][a-z]{2}/.test(cell.getAttribute("aria-label") || ""),
            ).length,
            datedContributionCells: document.querySelectorAll(
              "[data-github-contribution-calendar] > button[data-contribution-day]:not([data-contribution-day=''])",
            ).length,
            contributionFallbacks: document.querySelectorAll("[data-github-activity-fallback]").length,
            credentialLinks: document.querySelectorAll("a[href='/credentials'] [data-credential-bento-preview]").length,
            aboutCredentialPassports: document.querySelectorAll("[data-about-credential-passport]").length,
            aboutCredentialPassportClipped: (() => {
              const passport = document.querySelector("[data-about-credential-passport]");
              const card = passport?.closest("a")?.querySelector(":scope > div");
              if (!passport || !card) return false;
              const passportRect = passport.getBoundingClientRect();
              const cardRect = card.getBoundingClientRect();
              return (
                passportRect.left < cardRect.left ||
                passportRect.right > cardRect.right ||
                passportRect.top < cardRect.top ||
                passportRect.bottom > cardRect.bottom
              );
            })(),
            aboutCredentialLedgerClipped: (() => {
              const passport = document.querySelector("[data-about-credential-passport]");
              if (!passport) return false;
              const passportRect = passport.getBoundingClientRect();
              return [...passport.querySelectorAll("[data-credential-ledger-row]")].some((row) => {
                const rowRect = row.getBoundingClientRect();
                return rowRect.top < passportRect.top || rowRect.bottom > passportRect.bottom;
              });
            })(),
            homeCredentialArchives: document.querySelectorAll("[data-home-credential-archive]").length,
            homeCredentialArchiveText: document.querySelector("[data-home-credential-archive]")?.textContent || "",
            siteCardHeightSpread: (() => {
              const archive = document.querySelector("[data-home-credential-archive]");
              const grid = archive?.closest("a")?.parentElement?.parentElement;
              const cards = [...(grid?.children || [])]
                .map((column) => column.querySelector(":scope > a"))
                .filter(Boolean)
                .map((card) => card.getBoundingClientRect().height);
              return cards.length === 3 ? Math.max(...cards) - Math.min(...cards) : 0;
            })(),
            statsLinks: document.querySelectorAll("a[href='/stats']").length,
            shortCards: [...document.querySelectorAll("[data-github-contribution-calendar]")].filter(
              (calendar) => calendar.getBoundingClientRect().height < 68,
            ).length,
            scrapbookOverlap: (() => {
              const heading = [...document.querySelectorAll("h3")].find(
                (element) => element.textContent === "Behind the handle",
              );
              const card = heading?.parentElement?.parentElement;
              const subtitle = heading?.nextElementSibling;
              const stickers = card?.querySelectorAll("[role='img']") || [];
              if (!subtitle || stickers.length === 0) return false;
              const subtitleBottom = subtitle.getBoundingClientRect().bottom;
              return [...stickers].some(
                (sticker) => sticker.getBoundingClientRect().top < subtitleBottom,
              );
            })(),
          }));
          assert.equal(result.overflow, 0, `${route} ${theme} ${width}px overflow`);
          assert.equal(result.githubCards, 1, `${route} ${theme} ${width}px GitHub card`);
          assert.equal(result.githubInlineHeaders, 1, `${route} ${theme} ${width}px GitHub inline status`);
          assert.equal(result.githubTotals, result.contributionCalendars, `${route} ${theme} ${width}px GitHub total`);
          assert.equal(result.githubTotalLabels, result.contributionCalendars, `${route} ${theme} ${width}px GitHub total label`);
          assert.equal(result.githubTypographyMatches, true, `${route} ${theme} ${width}px GitHub typography parity`);
          assert.equal(result.githubLegends, result.contributionCalendars, `${route} ${theme} ${width}px GitHub legend`);
          assert.equal(result.contributionCalendars + result.contributionFallbacks, 1, `${route} ${theme} ${width}px contribution state`);
          if (result.contributionCalendars) {
            assert.equal(result.contributionCells, result.visibleContributionCells, `${route} ${theme} ${width}px visible contribution cells`);
            assert.equal(result.contributionCells, result.contributionWeeks * 7, `${route} ${theme} ${width}px complete contribution weeks`);
            assert.ok(result.contributionWeeks >= 8, `${route} ${theme} ${width}px useful contribution window`);
            assert.ok(result.contributionCellSizes.every((size) => size >= 12 && size <= 14), `${route} ${theme} ${width}px square sizing`);
            assert.ok(result.contributionHorizontalRemainder >= 0 && result.contributionHorizontalRemainder < 18, `${route} ${theme} ${width}px chart width fill`);
            assert.equal(result.contributionTabStops, 1, `${route} ${theme} ${width}px contribution tab stop`);
            assert.equal(result.contributionLabels, result.datedContributionCells, `${route} ${theme} ${width}px contribution labels`);
          }
          assert.equal(result.credentialLinks, 1, `${route} ${theme} ${width}px credential card`);
          assert.equal(result.aboutCredentialPassports, route === "/about" ? 1 : 0, `${route} ${theme} ${width}px About credential passport`);
          assert.equal(result.aboutCredentialPassportClipped, false, `${route} ${theme} ${width}px About credential passport clipping`);
          assert.equal(result.aboutCredentialLedgerClipped, false, `${route} ${theme} ${width}px About credential ledger clipping`);
          assert.equal(result.homeCredentialArchives, route === "/" ? 1 : 0, `${route} ${theme} ${width}px generic credential archive`);
          if (route === "/") {
            assert.doesNotMatch(result.homeCredentialArchiveText, /Harvard|Cisco|Microsoft/);
            assert.ok(result.siteCardHeightSpread < 1, `${route} ${theme} ${width}px Behind-the-site card alignment`);
          }
          assert.equal(result.statsLinks, 0, `${route} ${theme} ${width}px retired Stats links`);
          assert.equal(result.shortCards, 0, `${route} ${theme} ${width}px chart geometry`);
          assert.equal(result.scrapbookOverlap, false, `${route} ${theme} ${width}px scrapbook overlap`);
          assert.deepEqual(errors, [], `${route} ${theme} ${width}px errors`);

          if (route === "/" && width === 1440) {
            const activeCell = page.locator("[data-github-contribution-calendar] > button[aria-label^='91 contributions']");
            await activeCell.hover();
            const tooltip = page.locator("[data-github-activity-tooltip]");
            await tooltip.waitFor();
            assert.match((await tooltip.textContent()) || "", /91 contributions/);
            const tooltipRect = await tooltip.boundingBox();
            const calendarRect = await page.locator("[data-github-contribution-calendar]").boundingBox();
            assert.ok(tooltipRect && calendarRect && Math.abs(tooltipRect.x + tooltipRect.width - (calendarRect.x + calendarRect.width)) < 1.5, "GitHub tooltip top-right alignment");

            const selectedCell = page.locator("[data-github-contribution-calendar] > button[tabindex='0']");
            const selectedLabel = await selectedCell.getAttribute("aria-label");
            await selectedCell.focus();
            await selectedCell.press("ArrowLeft");
            const movedLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
            assert.notEqual(movedLabel, selectedLabel, "GitHub calendar arrow-key navigation");

            await page.getByRole("button", { name: "More" }).hover();
            const panel = page.locator("#navbar-more-panel");
            await panel.waitFor();
            assert.equal(await panel.locator("a[href='/buildlog']").count(), 1);
            assert.equal(await panel.locator("a[href='/stats']").count(), 0);
          }

          if (route === "/" && width === 320) {
            const touchCell = page.locator("[data-github-contribution-calendar] > button[aria-label^='91 contributions']");
            await touchCell.evaluate((cell) =>
              cell.dispatchEvent(
                new PointerEvent("pointerdown", {
                  bubbles: true,
                  pointerType: "touch",
                }),
              ),
            );
            const touchTooltip = page.locator("[data-github-activity-tooltip]");
            await touchTooltip.waitFor();
            assert.match((await touchTooltip.textContent()) || "", /91 contributions/);
          }

          if (route === "/about" && width === 1440) {
            const credentialLink = page.locator("a[href='/credentials']").filter({
              has: page.locator("[data-about-credential-passport]"),
            });
            await credentialLink.focus();
            await page.waitForFunction(() => {
              const issuer = [...document.querySelectorAll("span")].find(
                (element) => element.textContent === "Harvard University",
              );
              return issuer && getComputedStyle(issuer).opacity === "1";
            });
            const issuerOpacity = await page.getByText("Harvard University", { exact: true }).evaluate(
              (issuer) => getComputedStyle(issuer).opacity,
            );
            assert.equal(issuerOpacity, "1", "About credential issuer reveal on keyboard focus");
          }
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
