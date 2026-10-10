import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";
const slug = "medicalink-hms";

test("project detail stays readable from phone to desktop in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "MedicaLink HMS", level: 1 }).waitFor();
    const pause = page.getByRole("button", { name: "Pause carousel" });
    if (await pause.count()) await pause.click();
    await page.waitForFunction(() => {
      const photos = [...document.querySelectorAll('figure[aria-label^="Image "] img:not([alt=""])')]
        .filter((image) => image.getBoundingClientRect().width > 0);
      return photos.length === 2 && photos.every((image) => image.complete && image.naturalWidth > 0);
    }, undefined, { timeout: 15000 });

    for (const theme of ["dark", "light"]) {
      const dark = await page.locator("html").evaluate((node) => node.classList.contains("dark"));
      if (dark !== (theme === "dark")) {
        await page.getByRole("button", { name: `Switch to ${theme} mode` }).click();
        await page.waitForFunction((wanted) => document.documentElement.classList.contains("dark") === wanted, theme === "dark");
      }
      for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        const result = await page.evaluate(() => {
          const frame = document.querySelector('figure[aria-label^="Image "]');
          const photos = [...frame.querySelectorAll('img:not([alt=""])')].filter((image) => {
            const bounds = image.getBoundingClientRect();
            return bounds.width > 0 && bounds.height > 0 && getComputedStyle(image).visibility !== "hidden";
          });
          const share = document.querySelector('button[aria-controls="project-share-options"]').getBoundingClientRect();
          return {
            h1: document.querySelectorAll("main h1").length,
            overflow: document.documentElement.scrollWidth - innerWidth,
            photos: photos.map((photo) => {
              const card = photo.parentElement.getBoundingClientRect();
              return { ratio: card.width / card.height, alt: photo.alt };
            }),
            shareInView: share.left >= 0 && share.right <= innerWidth,
          };
        });
        assert.equal(result.h1, 1, `${theme} ${width}: one page heading`);
        assert.ok(result.overflow <= 1, `${theme} ${width}: document overflow ${result.overflow}px`);
        assert.equal(result.photos.length, width >= 1024 ? 2 : 1, `${theme} ${width}: visible cards`);
        assert.ok(result.photos.every((photo) => photo.alt && Math.abs(photo.ratio - 1.5) < 0.01), `${theme} ${width}: 3:2 accessible images`);
        assert.ok(result.shareInView, `${theme} ${width}: share trigger inside viewport`);
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("project detail share, related links, metadata and missing route use their local contracts", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "MedicaLink HMS", level: 1 }).waitFor();
    assert.match(await page.title(), /^MedicaLink HMS \|/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/projects\/medicalink-hms$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    assert.ok(await page.locator('meta[name="twitter:image"]').getAttribute("content"));
    const data = await page.locator('script[type="application/ld+json"]').allTextContents();
    assert.ok(data.map((value) => JSON.parse(value)).some((value) => value["@type"] === "CreativeWork" && value.name === "MedicaLink HMS"));

    const share = page.getByRole("button", { name: "Share project" });
    await share.focus();
    await page.keyboard.press("Enter");
    assert.equal(await share.getAttribute("aria-expanded"), "true");
    assert.equal(await page.getByRole("button", { name: "Copy URL" }).evaluate((node) => document.activeElement === node), true);
    for (const name of ["Copy URL", "View as Markdown", "Open in ChatGPT", "Open in Claude"]) {
      assert.equal(await page.getByRole("group", { name: "Share project" }).getByRole(name === "Open in ChatGPT" ? "link" : "button", { name: new RegExp(name) }).count(), 1);
    }
    await page.keyboard.press("Escape");
    assert.equal(await share.getAttribute("aria-expanded"), "false");
    assert.equal(await share.evaluate((node) => document.activeElement === node), true);
    await share.click();
    await page.getByRole("button", { name: "Copy URL" }).click();
    assert.match(await page.getByRole("status").filter({ hasText: /URL copied|Copy unavailable/ }).innerText(), /URL copied|Copy unavailable/);
    await page.getByRole("heading", { name: "Overview" }).click();
    assert.equal(await share.getAttribute("aria-expanded"), "false");

    const related = page.getByRole("region", { name: "Related projects" }).locator('a[href^="/projects/"]').first();
    const destination = await related.getAttribute("href");
    await related.click();
    await page.waitForURL((url) => url.pathname === destination);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.goBack();
    await page.getByRole("heading", { name: "MedicaLink HMS", level: 1 }).waitFor();

    const missing = await page.request.get(`${baseUrl}/projects/not-a-published-project-9d21a`);
    assert.equal(missing.status(), 404);
    assert.match(missing.headers()["x-robots-tag"] || "", /noindex/);
    assert.doesNotMatch(await missing.text(), /Share project|At a glance/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("project detail carousel respects reduced motion without losing keyboard controls", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    const figure = page.getByRole("figure", { name: /^Image \d+ of 3$/ });
    await figure.waitFor();
    await page.getByRole("button", { name: "Play carousel" }).waitFor();
    await page.getByRole("button", { name: "Next image" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("figure", { name: "Image 2 of 3" }).waitFor();
    assert.equal(await figure.locator('img:not([alt=""]):visible').count(), 2);
    assert.equal(await page.getByRole("button", { name: "Show image 3 caption" }).isVisible(), true);
  } finally {
    await browser.close();
  }
});
