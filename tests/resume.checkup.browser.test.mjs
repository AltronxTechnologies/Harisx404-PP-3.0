import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.RESUME_BASE_URL || "http://localhost:3000";

test("Resume gateway and document actions stay contained across widths and themes", async () => {
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
        const response = await page.goto(`${baseUrl}/resume`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.getByRole("link", { name: "Download PDF" }).waitFor();
        for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const state = await page.evaluate(() => {
            const card = document.querySelector('section[aria-label="Current Resume"] article').getBoundingClientRect();
            const actions = [...document.querySelectorAll('section[aria-label="Current Resume"] article a')].map((link) => link.getBoundingClientRect());
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth - innerWidth,
              h1: document.querySelectorAll("main h1").length,
              card: { left: card.left, right: card.right },
              actions: actions.map((box) => ({ left: box.left, right: box.right, height: box.height })),
              benefits: document.querySelectorAll('section[aria-label="Current Resume"] ul > li').length,
            };
          });
          assert.equal(state.theme, theme, `${width}: theme`);
          assert.ok(state.overflow <= 1, `${theme} ${width}: ${state.overflow}px overflow`);
          assert.equal(state.h1, 1);
          assert.ok(state.card.left >= 0 && state.card.right <= width + 1, `${width}: card bounds`);
          assert.equal(state.actions.length, 2);
          assert.ok(state.actions.every((action) => action.left >= 0 && action.right <= width + 1 && action.height >= 48), `${width}: action bounds`);
          assert.equal(state.benefits, 3);
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

test("Resume metadata and inline/download routes deliver identical safe PDF bytes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/resume`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Download PDF" }).waitFor();
    assert.match(await page.title(), /^Resume - Muhammad Haris \|/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/resume$/);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    const open = page.getByRole("link", { name: "Open Resume in a new tab" });
    assert.equal(await open.getAttribute("href"), "/resume/file");
    assert.equal(await open.getAttribute("target"), "_blank");
    assert.equal(await open.getAttribute("rel"), "noopener noreferrer");
    assert.equal(await page.getByRole("link", { name: "Download PDF" }).getAttribute("href"), "/resume/file?download=1");
    const [inline, download] = await Promise.all([
      page.request.get(`${baseUrl}/resume/file`),
      page.request.get(`${baseUrl}/resume/file?download=1`),
    ]);
    assert.equal(inline.status(), 200);
    assert.equal(download.status(), 200);
    for (const response of [inline, download]) {
      assert.match(response.headers()["content-type"], /^application\/pdf/);
      assert.equal(response.headers()["x-content-type-options"], "nosniff");
      assert.match(response.headers()["cache-control"], /no-store/);
      assert.match(response.headers()["content-disposition"], /filename\*=UTF-8''/);
    }
    assert.match(inline.headers()["content-disposition"], /^inline;/);
    assert.match(download.headers()["content-disposition"], /^attachment;/);
    const first = await inline.body();
    const second = await download.body();
    assert.equal(first.subarray(0, 5).toString(), "%PDF-");
    assert.deepEqual(first, second);
    assert.equal(Number(inline.headers()["content-length"]), first.length);
    assert.ok(first.length > 100_000);
  } finally {
    await browser.close();
  }
});

test("Resume actions remain reachable on touch and with enlarged text", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}/resume`, { waitUntil: "domcontentloaded" });
    const open = page.getByRole("link", { name: "Open Resume in a new tab" });
    const download = page.getByRole("link", { name: "Download PDF" });
    await download.waitFor();
    const hit = await download.boundingBox();
    assert.ok(hit.width > 100 && hit.height >= 48);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const width of [640, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        actions: [...document.querySelectorAll('section[aria-label="Current Resume"] article a')].map((link) => link.getBoundingClientRect()),
      }));
      assert.ok(state.overflow <= 1, `${width} enlarged text: ${state.overflow}px overflow`);
      assert.ok(state.actions.every((action) => action.left >= 0 && action.right <= width + 1), `${width}: ${JSON.stringify(state.actions)}`);
    }
    assert.equal(await open.getAttribute("href"), "/resume/file");
  } finally {
    await browser.close();
  }
});
