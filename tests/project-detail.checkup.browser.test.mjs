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

test("streamed detail loading never flashes the Projects index skeleton", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const detailResponse = await page.request.get(`${baseUrl}/projects/${slug}?loading-check=1`);
    const indexResponse = await page.request.get(`${baseUrl}/projects?loading-check=1`);
    assert.equal(detailResponse.status(), 200);
    assert.equal(indexResponse.status(), 200);
    const detailHtml = await detailResponse.text();
    const indexHtml = await indexResponse.text();
    assert.match(detailHtml, /role="status" aria-label="Loading project details"/);
    assert.equal((detailHtml.match(/role="status" aria-label="Loading project details"/g) || []).length, 1);
    assert.doesNotMatch(detailHtml, /role="status">Loading projects/);
    assert.match(indexHtml, /role="status">Loading projects/);
    assert.doesNotMatch(indexHtml, /aria-label="Loading project details"/);

    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "MedicaLink HMS", level: 1 }).waitFor();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate((html) => {
        const main = document.querySelector("main");
        const actual = main.querySelector('section[aria-labelledby="project-facts-heading"]').getBoundingClientRect();
        const loader = new DOMParser().parseFromString(html, "text/html").querySelector('[aria-label="Loading project details"]');
        [...main.children].forEach((node) => { node.style.display = "none"; });
        main.append(document.importNode(loader, true));
        const skeleton = main.querySelector('[aria-label="Loading project details"]');
        const frame = skeleton.querySelector(".rounded-3xl.border").getBoundingClientRect();
        const cards = [...skeleton.querySelectorAll(".aspect-\\[3\\/2\\]")]
          .filter((node) => node.getBoundingClientRect().width > 0)
          .map((node) => { const rect = node.getBoundingClientRect(); return rect.width / rect.height; });
        const result = { factOffset: Math.abs(frame.top - actual.top), overflow: document.documentElement.scrollWidth - innerWidth, cards };
        skeleton.remove();
        [...main.children].forEach((node) => { node.style.display = ""; });
        return result;
      }, detailHtml);
      assert.ok(geometry.factOffset < 40, `${width}: facts loading frame offset ${geometry.factOffset}px`);
      assert.ok(geometry.overflow <= 1, `${width}: loading overflow ${geometry.overflow}px`);
      assert.equal(geometry.cards.length, width >= 1024 ? 2 : 1);
      assert.ok(geometry.cards.every((ratio) => Math.abs(ratio - 1.5) < 0.01));
    }
  } finally {
    await browser.close();
  }
});

test("touch controls and carousel swipe work on phone and tablet in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("figure", { name: "Image 1 of 3" }).waitFor();
    await page.getByRole("button", { name: "Pause carousel" }).tap();
    for (const theme of ["dark", "light"]) {
      const dark = await page.locator("html").evaluate((node) => node.classList.contains("dark"));
      if (dark !== (theme === "dark")) await page.getByRole("button", { name: `Switch to ${theme} mode` }).tap();
      for (const width of [320, 390, 768, 1024]) {
        await page.setViewportSize({ width, height: 844 });
        const share = page.getByRole("button", { name: "Share project" });
        await share.tap();
        assert.equal(await share.getAttribute("aria-expanded"), "true", `${theme} ${width}: touch share opens`);
        await share.tap();
        assert.equal(await share.getAttribute("aria-expanded"), "false", `${theme} ${width}: touch share closes`);
        const figure = page.getByRole("figure", { name: "Image 1 of 3" });
        await figure.scrollIntoViewIfNeeded();
        const caption = page.getByRole("button", { name: "Show image 1 caption" });
        await caption.tap();
        assert.equal(await page.getByRole("region", { name: "Image caption" }).count(), 1);
        await page.getByRole("button", { name: "Close image caption" }).tap();
        assert.equal(await page.getByRole("region", { name: "Image caption" }).count(), 0);
        assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width, `${theme} ${width}: touch reflow`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("figure", { name: "Image 1 of 3" }).scrollIntoViewIfNeeded();
    const frame = await page.getByRole("figure", { name: "Image 1 of 3" }).boundingBox();
    const y = frame.y + frame.height / 2;
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: frame.x + frame.width * 0.8, y }] });
    for (let index = 1; index <= 8; index++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: frame.x + frame.width * (0.8 - index * 0.08), y }] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.getByRole("figure", { name: "Image 2 of 3" }).waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("project detail reflows with enlarged text without losing controls", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 900 } });
    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "MedicaLink HMS", level: 1 }).waitFor();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${width}px with 200% text: ${overflow}px overflow`);
      const share = page.getByRole("button", { name: "Share project" });
      await share.click();
      assert.equal(await share.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await share.getAttribute("aria-expanded"), "false");
    }
  } finally {
    await browser.close();
  }
});

test("every currently linked published case study renders an image and accessible details on phone and desktop", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const indexHtml = await (await page.request.get(`${baseUrl}/projects`)).text();
    const slugs = [...new Set([...indexHtml.matchAll(/href="\/projects\/([a-z0-9-]+)"/g)].map((match) => match[1]))];
    assert.ok(slugs.length > 0, "connected index must supply published detail links");
    for (const projectSlug of slugs) {
      const response = await page.goto(`${baseUrl}/projects/${projectSlug}`, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200, projectSlug);
      await page.locator("main h1").waitFor();
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForFunction(() => {
          const image = document.querySelector('figure[aria-label^="Image "] img:not([alt=""])');
          return image && image.complete && image.naturalWidth > 0;
        }, undefined, { timeout: 15000 });
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          headings: document.querySelectorAll("main h1").length,
          imageAlt: document.querySelector('figure[aria-label^="Image "] img:not([alt=""])')?.alt,
          share: Boolean(document.querySelector('button[aria-label="Share project"], button[aria-controls="project-share-options"]')),
        }));
        assert.ok(state.overflow <= 1, `${projectSlug} ${width}: overflow ${state.overflow}px`);
        assert.equal(state.headings, 1, `${projectSlug} ${width}: one H1`);
        assert.ok(state.imageAlt, `${projectSlug} ${width}: descriptive cover`);
        assert.equal(state.share, true, `${projectSlug} ${width}: share control`);
      }
    }
  } finally {
    await browser.close();
  }
});
