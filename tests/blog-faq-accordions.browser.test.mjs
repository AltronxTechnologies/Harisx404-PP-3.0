import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";
const slugs = [
  "securing-ai-agents", "post-quantum-cryptography-migration", "ai-security-operations-center",
  "reliable-rag", "small-vs-large-language-models", "ai-application-evaluation",
  "ai-workloads-network-architecture", "zero-trust-networking-cloud",
  "nextjs-16-cache-components", "type-safe-mern-typescript",
];

test("published FAQ answers remain in server HTML as native, initially collapsed details", async () => {
  for (const slug of slugs) {
    const response = await fetch(`${baseUrl}/blog/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.ok((html.match(/name="article-faq"/g) || []).length >= 4, `${slug}: article FAQs render`);
    assert.match(html, /href="#frequently-asked-questions"/);
    assert.doesNotMatch(html, /This article content is unavailable because its formatting could not be safely rendered/);
  }
});

test("FAQ keyboard, single-open behavior, IDs and layout work at phone and desktop widths", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, theme] of [[320, "light"], [1280, "dark"]]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseUrl}/blog/reliable-rag`, { waitUntil: "domcontentloaded" });
      const items = page.locator('#blog-article details[name="article-faq"]');
      await items.first().waitFor();
      assert.equal(await items.count(), 5);
      assert.equal(await items.first().getAttribute("id"), "is-rag-the-same-as-fine-tuning");
      assert.equal(await items.first().getAttribute("open"), null);
      const first = items.first().locator("summary");
      await first.focus();
      await page.keyboard.press("Enter");
      assert.equal(await items.first().evaluate((node) => node.open), true);
      assert.match(await items.first().innerText(), /RAG supplies knowledge at question time/);
      await items.nth(1).locator("summary").click();
      assert.equal(await items.first().evaluate((node) => node.open), false);
      assert.equal(await items.nth(1).evaluate((node) => node.open), true);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test("the corrected published answers avoid the four verified factual overstatements", async () => {
  const articles = [
    ["securing-ai-agents", /Prompt injection is an attempt to make a model follow instructions from lower-trust content/, /It is text the model reads and treats as an instruction/],
    ["ai-security-operations-center", /long-term staffing effects remain uncertain/, /Current evidence points to reallocation, not replacement/],
    ["type-safe-mern-typescript", /application-level model validation/, /database-level rules/],
  ];
  for (const [slug, updated, outdated] of articles) {
    const html = await fetch(`${baseUrl}/blog/${slug}`).then((response) => response.text());
    assert.match(html, updated, slug);
    assert.doesNotMatch(html, outdated, slug);
  }
  const soc = await fetch(`${baseUrl}/blog/ai-security-operations-center`).then((response) => response.text());
  assert.match(soc, /tool actions taken, and their outcomes/);
});
