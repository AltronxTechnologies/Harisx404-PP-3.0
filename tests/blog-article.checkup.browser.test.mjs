import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";
const slug = "securing-ai-agents";
const url = `${baseUrl}/blog/${slug}`;

test("published Blog article is readable at phone through wide desktop in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.locator("#blog-article p").first().waitFor();
        for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const article = document.querySelector("#blog-article");
            const box = article.getBoundingClientRect();
            const code = article.querySelector("pre");
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              h1: document.querySelectorAll("main h1").length,
              articleWidth: box.width, articleLeft: box.left, articleRight: box.right,
              text: article.textContent.trim().length,
              codeInside: !code || (code.getBoundingClientRect().left >= 0 && code.getBoundingClientRect().right <= innerWidth + 1),
              reactions: document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button').length,
              anchorCount: article.querySelectorAll("h2[id] a.anchor, h3[id] a.anchor").length,
            };
          });
          assert.equal(state.theme, theme, `${width}: theme`);
          assert.ok(state.overflow <= 1, `${theme} ${width}: ${state.overflow}px document overflow`);
          assert.equal(state.h1, 1, `${width}: only article title is H1`);
          assert.ok(state.articleWidth > 0 && state.articleLeft >= 0 && state.articleRight <= width + 1, `${width}: reading column fits`);
          assert.ok(state.text > 1000 && state.codeInside && state.anchorCount > 0);
          assert.equal(state.reactions, 4, `${width}: reaction controls render, no write attempted`);
        }
        assert.deepEqual(errors, [], `${theme}: page/console errors`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Blog article metadata, anchors, share/copy, TOC and related navigation work without writes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, permissions: ["clipboard-read", "clipboard-write"] });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator("#blog-article h2[id] a.anchor").first().waitFor();
    assert.match(await page.title(), /^Securing AI Agents:.*\| harisx404$/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/blog\/securing-ai-agents$/);
    assert.equal(await page.locator('meta[property="og:type"]').getAttribute("content"), "article");
    assert.ok(await page.locator('meta[property="og:image"]').first().getAttribute("content"));
    const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
    const article = data.find((entry) => entry["@type"] === "BlogPosting");
    assert.ok(article && article.headline.includes("Securing AI Agents") && Date.parse(article.datePublished));
    assert.match(article.mainEntityOfPage["@id"], /\/blog\/securing-ai-agents$/);
    const ids = await page.locator("#blog-article h2[id], #blog-article h3[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
    assert.equal(ids.length, new Set(ids).size);
    const firstAnchor = page.locator("#blog-article h2[id] a.anchor").first();
    assert.equal(await firstAnchor.getAttribute("href"), `#${ids[0]}`);

    const copy = page.getByRole("button", { name: "Copy URL" });
    await copy.click();
    await page.getByRole("button", { name: "Copied!" }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), page.url());
    const more = page.getByRole("button", { name: "More share options" });
    await more.click();
    const options = page.getByRole("group", { name: "Share options" });
    await options.waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await options.count(), 0);
    assert.equal(await more.evaluate((node) => document.activeElement === node), true);

    const code = page.getByRole("button", { name: "Copy code" }).first();
    await code.click();
    await page.getByRole("status").filter({ hasText: /Copied|Copy failed/ }).first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 600));
    const toc = page.locator('nav[aria-label="Table of contents"]');
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table of contents"]')?.getAttribute("aria-hidden") === "false");
    await toc.getByRole("button", { name: /Open table of contents/ }).click();
    await toc.getByRole("button", { name: "Close table of contents" }).waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await toc.getByRole("button", { name: "Close table of contents" }).count(), 0);

    const related = page.getByRole("region", { name: "Related articles" }).locator('a[href^="/blog/"]').first();
    const destination = await related.getAttribute("href");
    await related.click();
    await page.waitForURL((location) => location.pathname === destination);
    await page.locator("#blog-article p").first().waitFor();
    await page.goBack();
    await page.locator("#blog-article h2[id]").first().waitFor();
    await page.getByRole("link", { name: "Back to Blog" }).click();
    await page.waitForURL((location) => location.pathname === "/blog");
  } finally {
    await browser.close();
  }
});

test("all currently syndicated articles are reachable and missing or retired slugs are 404", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const feed = await (await page.request.get(`${baseUrl}/rss.xml`)).text();
    const slugs = [...new Set([...feed.matchAll(/<link>[^<]*\/blog\/([^<]+)<\/link>/g)].map((match) => match[1]))];
    assert.ok(slugs.length > 0);
    for (const articleSlug of slugs) {
      const response = await page.goto(`${baseUrl}/blog/${articleSlug}`, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200, articleSlug);
      await page.locator("#blog-article p").first().waitFor();
      assert.equal(await page.locator("main h1").count(), 1, articleSlug);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, articleSlug);
      assert.equal(await page.locator("#blog-article p[role=alert]").count(), 0, articleSlug);
    }
    for (const articleSlug of ["not-a-published-article-9d21a", "tailwind-2-is-live"]) {
      const response = await page.request.get(`${baseUrl}/blog/${articleSlug}`);
      assert.equal(response.status(), 404, articleSlug);
      assert.match(response.headers()["x-robots-tag"] || "", /noindex/);
      assert.doesNotMatch(await response.text(), /id="blog-article"/);
    }
  } finally {
    await browser.close();
  }
});

test("article reading controls remain accessible under touch and enlarged text", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator("#blog-article h2[id]").first().waitFor();
    const more = page.getByRole("button", { name: "More share options" });
    await more.tap();
    await page.getByRole("group", { name: "Share options" }).waitFor();
    await more.tap();
    assert.equal(await page.getByRole("group", { name: "Share options" }).count(), 0);
    const headingLink = page.locator("#blog-article h2[id] a.anchor").first();
    await headingLink.tap();
    assert.equal(new URL(page.url()).hash, await headingLink.getAttribute("href"));
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => {
        const article = document.getElementById("blog-article").getBoundingClientRect();
        const header = document.querySelector(".blog-detail header h1").getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth - innerWidth, articleRight: article.right, titleRight: header.right };
      });
      assert.ok(state.overflow <= 1, `${width} with enlarged text: ${state.overflow}px overflow`);
      assert.ok(state.articleRight <= width + 1 && state.titleRight <= width + 1);
    }
  } finally {
    await browser.close();
  }
});
