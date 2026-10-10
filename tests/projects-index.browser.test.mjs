import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("Projects search, tag and URL state stay in sync across rapid actions and history", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/projects`, { waitUntil: "networkidle" });
    const search = page.getByRole("searchbox", { name: "Search projects" });
    const tag = page.getByRole("button", { name: "Cybersecurity", exact: true });
    await search.fill("security");
    await tag.click();
    await page.waitForURL((url) => url.searchParams.get("q") === "security" && url.searchParams.get("tag") === "Cybersecurity");
    assert.equal(await tag.getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "All projects" }).click();
    await page.waitForURL((url) => url.searchParams.get("q") === "security" && !url.searchParams.has("tag"));
    await page.goBack({ waitUntil: "networkidle" });
    assert.equal(await tag.getAttribute("aria-pressed"), "true");
    assert.equal(await search.inputValue(), "security");
    await page.goForward({ waitUntil: "networkidle" });
    assert.equal(await tag.getAttribute("aria-pressed"), "false");

    await page.goto(`${baseUrl}/projects`, { waitUntil: "networkidle" });
    await tag.click();
    await search.fill("security");
    await page.waitForURL((url) => url.searchParams.get("q") === "security" && url.searchParams.get("tag") === "Cybersecurity");
    await search.fill("zzzx-no-project");
    await page.waitForURL((url) => url.searchParams.get("q") === "zzzx-no-project");
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.waitForURL((url) => url.pathname === "/projects" && !url.searchParams.has("tag") && !url.searchParams.has("q"));
    assert.equal(await search.inputValue(), "");

    await page.goto(`${baseUrl}/projects?page=999`, { waitUntil: "networkidle" });
    await page.waitForURL((url) => url.pathname === "/projects" && !url.searchParams.has("page"));
    for (const malformed of ["0", "2junk", "01"]) {
      await page.goto(`${baseUrl}/projects?page=${malformed}`, { waitUntil: "networkidle" });
      await page.waitForURL((url) => url.pathname === "/projects" && !url.searchParams.has("page"));
    }
    await page.close();
  } finally {
    await browser.close();
  }
});

test("Projects desktop reading order follows its staggered visual order and filtered cards explain the match", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/projects`, { waitUntil: "networkidle" });
    const cards = await page.locator("main article:visible").evaluateAll((articles) => articles.map((article) => ({
      title: article.querySelector("h3")?.textContent?.trim(),
      y: article.getBoundingClientRect().top,
    })));
    assert.ok(cards.length > 1, "the connected collection exercises both columns");
    assert.deepEqual(cards.map((card) => card.title), [...cards].sort((a, b) => a.y - b.y).map((card) => card.title));
    const cover = page.locator("main article:visible a[aria-label^='View '][href^='/projects/']").first();
    const bounds = await cover.boundingBox();
    assert.ok(bounds && Math.abs(bounds.width / bounds.height - 1.5) < 0.01);

    if (await page.getByRole("button", { name: "HealthCare", exact: true }).count()) {
      await page.getByRole("button", { name: "HealthCare", exact: true }).click();
      await page.waitForURL((url) => url.searchParams.get("tag") === "HealthCare");
      const chips = await page.locator("main article:visible span[title]").allTextContents();
      assert.ok(chips.some((chip) => chip.trim() === "HealthCare"));
    }
    await page.close();
  } finally {
    await browser.close();
  }
});
