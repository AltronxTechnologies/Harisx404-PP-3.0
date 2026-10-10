import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";
const collection = 'section[aria-label="Browse articles"]';
const cards = `${collection} a[href^="/blog/"]`;

test("Blog index keeps its published cards visible across widths and themes", async () => {
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
        const response = await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.locator(cards).first().waitFor();
        for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForURL((url) => (url.searchParams.get("view") === "compact") === (width < 1024));
          const state = await page.evaluate((selector) => {
            const links = [...document.querySelectorAll(selector)].filter((link) => link.getBoundingClientRect().width > 0);
            const first = links[0].getBoundingClientRect();
            const featuredImage = links[0].querySelector("img");
            const rail = document.querySelector('[role="group"][aria-label="Filter articles by category"]');
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              headingCount: document.querySelectorAll("main h1").length,
              cards: links.length,
              first: { left: first.left, right: first.right, width: first.width },
              railScrolls: rail.scrollWidth > rail.clientWidth,
              image: featuredImage?.alt === "" && featuredImage.complete && featuredImage.naturalWidth > 0,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            };
          }, cards);
          assert.equal(state.theme, theme, `${width}: theme`);
          assert.equal(state.headingCount, 1, `${width}: one H1`);
          assert.ok(state.overflow <= 1, `${width} ${theme}: overflow ${state.overflow}px`);
          assert.equal(state.cards, width < 1024 ? 7 : 10, `${width} ${theme}: first-page count`);
          assert.ok(state.first.width > 0 && state.first.left >= 0 && state.first.right <= width + 1);
          assert.equal(state.railScrolls, true, `${width}: category rail stays scrollable`);
          assert.equal(state.image, true, `${width}: featured cover loads`);
        }
        assert.deepEqual(errors, [], `${theme}: console/page errors`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Blog search and category selection preserve both intents and recover from empty states", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const reverse of [false, true]) {
      await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
      await page.locator(cards).first().waitFor();
      await page.waitForURL((url) => url.searchParams.get("view") === "compact");
      const search = page.getByRole("searchbox", { name: "Search articles" });
      const category = page.getByRole("button", { name: "AI SOC", exact: true });
      if (reverse) {
        await category.click();
        await search.fill("security");
      } else {
        await search.fill("security");
        await category.click();
      }
      await page.waitForURL((url) => url.searchParams.get("category") === "ai soc" && url.searchParams.get("q") === "security");
      assert.equal(await category.getAttribute("aria-pressed"), "true");
      assert.ok(await page.locator(cards).count() > 0);
      await page.goBack();
      await page.waitForURL((url) => !url.searchParams.has("category") && !url.searchParams.has("q"));
      assert.equal(await search.inputValue(), "");
      await page.goForward();
      await page.waitForURL((url) => url.searchParams.get("category") === "ai soc" && url.searchParams.get("q") === "security");
      assert.equal(await search.inputValue(), "security");
      await search.fill("definitely-no-result");
      await page.waitForURL((url) => url.searchParams.get("q") === "definitely-no-result");
      await page.getByText("No matching articles", { exact: true }).waitFor();
      await page.getByRole("link", { name: "View all articles" }).click();
      await page.waitForURL((url) => url.pathname === "/blog" && !url.searchParams.has("q") && !url.searchParams.has("category"));
      assert.ok(await page.locator(cards).count() > 0);
    }
    await page.goto(`${baseUrl}/blog?category=not-real`, { waitUntil: "domcontentloaded" });
    await page.getByText("Unknown category", { exact: true }).first().waitFor();
    assert.equal(await page.getByRole("link", { name: "View all articles" }).count(), 1);
    assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/blog$/);
  } finally {
    await browser.close();
  }
});

test("compact pagination, URL normalization and Blog metadata have consistent local states", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/blog?view=compact`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    assert.equal(await page.locator(cards).count(), 7);
    const pagination = page.getByRole("navigation", { name: "Blog pages" });
    await pagination.getByRole("link", { name: "Next" }).click();
    await page.waitForURL((url) => url.searchParams.get("page") === "2" && url.searchParams.get("view") === "compact");
    assert.equal(await page.locator(cards).count(), 3);
    await pagination.getByRole("link", { name: "Previous" }).click();
    await page.waitForURL((url) => !url.searchParams.has("page"));
    assert.equal(await page.locator(cards).count(), 7);

    for (const badPage of ["0", "2junk", "999"]) {
      await page.goto(`${baseUrl}/blog?page=${badPage}&view=compact`, { waitUntil: "domcontentloaded" });
      await page.waitForURL((url) => url.searchParams.get("page") === (badPage === "999" ? "2" : null) && url.searchParams.get("view") === "compact");
    }
    await page.goto(`${baseUrl}/blog?view=invalid`, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => !url.searchParams.has("view"));

    await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    assert.match(await page.title(), /Blog.*harisx404/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/blog$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    assert.ok(await page.locator('meta[name="twitter:image"]').getAttribute("content"));
    await page.goto(`${baseUrl}/blog?q=security`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/blog$/);
    const rss = await page.request.get(`${baseUrl}/rss.xml`);
    assert.equal(rss.status(), 200);
    assert.match(rss.headers()["content-type"], /xml/);
  } finally {
    await browser.close();
  }
});

test("Blog category rail and search remain usable with touch and enlarged text", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    const category = page.getByRole("button", { name: "AI SOC", exact: true });
    await category.tap();
    await page.waitForURL((url) => url.searchParams.get("category") === "ai soc" && url.searchParams.get("view") === "compact");
    assert.equal(await category.getAttribute("aria-pressed"), "true");
    const search = page.getByRole("searchbox", { name: "Search articles" });
    await search.tap();
    await search.fill("security");
    await page.waitForURL((url) => url.searchParams.get("category") === "ai soc" && url.searchParams.get("q") === "security");
    await page.getByRole("button", { name: "All articles" }).tap();
    await page.waitForURL((url) => !url.searchParams.has("category") && url.searchParams.get("q") === "security");

    await page.goto(`${baseUrl}/blog`, { waitUntil: "domcontentloaded" });
    await page.locator(cards).first().waitFor();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        search: document.querySelector('#blog-search').getBoundingClientRect(),
        filter: document.querySelector('[aria-label="Filter articles by category"]').getBoundingClientRect(),
      }));
      assert.ok(state.overflow <= 1, `${width} with enlarged text: ${state.overflow}px overflow`);
      assert.ok(state.search.width > 0 && state.search.left >= 0 && state.search.right <= width + 1);
      assert.ok(state.filter.width > 0 && state.filter.left >= 0 && state.filter.right <= width + 1);
    }
  } finally {
    await browser.close();
  }
});
