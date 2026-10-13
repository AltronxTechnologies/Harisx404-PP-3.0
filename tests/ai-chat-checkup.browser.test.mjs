import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("chat launcher and panel fit across themes and viewport sizes with keyboard focus return", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
        const launcher = page.getByRole("button", { name: "Toggle chat" });
        await launcher.waitFor();
        await launcher.click();
        const panel = page.locator("#portfolio-chat-panel");
        await panel.waitFor();
        assert.equal(await panel.getAttribute("role"), "dialog");
        assert.equal(await panel.getAttribute("aria-modal"), "false");
        for (const { width, height } of [
          { width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 },
          { width: 430, height: 900 }, { width: 768, height: 500 }, { width: 1024, height: 768 },
          { width: 1440, height: 900 },
        ]) {
          await page.setViewportSize({ width, height });
          const box = await panel.boundingBox();
          assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${theme} ${width}x${height}: ${JSON.stringify(box)}`);
          assert.equal(await launcher.isVisible(), width >= 640, `${theme} ${width}x${height}: only desktop keeps the launcher beside the panel`);
          if (width === 1440) assert.equal(box.width, 420);
          assert.ok((await panel.getByRole("textbox", { name: "Ask the portfolio assistant" }).boundingBox()).height > 0);
          assert.ok((await panel.getByRole("button", { name: "Close chat" }).boundingBox()).width >= 40);
          if (width === 320) {
            const welcome = await panel.evaluate((node) => {
              const scroller = node.children[1];
              const title = scroller.querySelector("h3").getBoundingClientRect();
              return { scrollTop: scroller.scrollTop, titleTop: title.top, scrollerTop: scroller.getBoundingClientRect().top };
            });
            assert.equal(welcome.scrollTop, 0, `${theme}: first-open greeting must start at top`);
            assert.ok(welcome.titleTop >= welcome.scrollerTop);
          }
        }
        await page.keyboard.press("Escape");
        assert.equal(await panel.count(), 0);
        assert.equal(await launcher.evaluate((node) => document.activeElement === node), true);
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("short viewports keep header, composer and a usable message scroller inside the panel", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 320 } });
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    const panel = page.locator("#portfolio-chat-panel");
    for (const [width, height, fontSize] of [[320, 320, 16], [568, 320, 16], [390, 350, 16], [390, 844, 32]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, fontSize);
      const layout = await panel.evaluate((node) => {
        const box = (element) => element.getBoundingClientRect();
        const scroll = node.querySelector("header + div");
        return {
          panel: box(node), header: box(node.querySelector("header")), form: box(node.querySelector("form")),
          input: box(node.querySelector("textarea")), close: box(node.querySelector('button[aria-label="Close chat"]')),
          scrollHeight: scroll.clientHeight, labelHeight: box(node.querySelector("header p")).height,
        };
      });
      assert.ok(layout.panel.top >= 0 && layout.panel.bottom <= height + 1, `${width}x${height}: panel in viewport`);
      assert.ok(layout.form.bottom <= layout.panel.bottom + 1 && layout.input.bottom <= layout.panel.bottom, `${width}x${height}: composer visible`);
      assert.ok(layout.close.right <= layout.panel.right && layout.header.top >= layout.panel.top, `${width}x${height}: header visible`);
      assert.ok(layout.scrollHeight >= 32, `${width}x${height}: messages remain scrollable`);
      if (width === 320) assert.ok(layout.labelHeight <= 16, "small-screen header label remains on one line");
    }
  } finally {
    await browser.close();
  }
});

test("phone sheet keeps compact suggestions, expandable composer and jump control usable in both themes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      await page.route("**/api/ai/chat", (route) => route.fulfill({
        status: 200, headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "A detailed answer. ".repeat(100), sources: [{ title: "About Haris", path: "/about" }] }),
      }));
      try {
        await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
        const launcher = page.getByRole("button", { name: "Toggle chat" });
        await launcher.click();
        const panel = page.getByRole("dialog", { name: "Haris AI assistant" });
        const box = await panel.boundingBox();
        assert.ok(box && Math.abs(box.x - 8) < 1 && Math.abs(box.y - 8) < 1 && box.width === 304 && box.height === 552);
        assert.equal(await launcher.isVisible(), false);
        const scroll = panel.locator("header + div");
        const form = panel.locator("form");
        const formBox = await form.boundingBox();
        for (const label of ["Featured projects", "Technical skills & stack", "Contact & collaboration"]) {
          const chip = panel.getByRole("button", { name: label });
          const chipBox = await chip.boundingBox();
          assert.ok(chipBox && chipBox.y + chipBox.height < formBox.y, `${theme}: ${label} starts above the composer`);
        }
        const input = panel.getByRole("textbox", { name: "Ask the portfolio assistant" });
        const initialHeight = (await input.boundingBox()).height;
        await input.fill("First line\nSecond line\nThird line\nFourth line");
        await page.waitForFunction((height) => document.querySelector('#portfolio-chat-panel textarea').getBoundingClientRect().height > height, initialHeight);
        assert.ok((await input.boundingBox()).height <= 112);
        await input.fill("Tell me more");
        await panel.getByRole("button", { name: "Send chat message" }).click();
        await panel.getByRole("link", { name: "About Haris" }).waitFor();
        await scroll.evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
        const jump = panel.getByRole("button", { name: "Jump to latest messages" });
        await jump.waitFor();
        const jumpBox = await jump.boundingBox();
        assert.ok(jumpBox && jumpBox.y + jumpBox.height <= (await form.boundingBox()).y, `${theme}: jump button stays above the composer`);
        await panel.getByRole("button", { name: "Close chat" }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Toggle chat");
        assert.equal(await launcher.isVisible(), true);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("retry after a partial interrupted answer resends the original user question", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const requests = [];
    await page.route("**/api/ai/chat", async (route) => {
      const payload = route.request().postDataJSON();
      requests.push(payload);
      if (requests.length === 1) {
        await route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: 'event: start\ndata: {"provider":"mock"}\n\nevent: delta\ndata: {"text":"Partial answer"}\n\nevent: error\ndata: {"code":"STREAM_INTERRUPTED","message":"Connection was interrupted while generating. Please retry."}\n\n' });
      } else {
        const last = payload.messages.at(-1);
        await route.fulfill({ status: last.role === "user" ? 200 : 400, headers: { "content-type": "text/event-stream" }, body: 'event: delta\ndata: {"text":"Recovered answer"}\n\nevent: done\ndata: {"totalLength":16}\n\n' });
      }
    });
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    await page.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("Where are the projects?");
    await page.getByRole("button", { name: "Send chat message" }).click();
    await page.getByRole("button", { name: "Retry question" }).waitFor();
    await page.getByRole("button", { name: "Retry question" }).click();
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Haris AI assistant"] [aria-live="polite"]').length > 0);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[1].messages.at(-1), { role: "user", content: "Where are the projects?" });
    await page.getByText("Recovered answer").waitFor();
    await page.setViewportSize({ width: 320, height: 568 });
    await page.getByRole("button", { name: "Start a new chat" }).click();
    await page.waitForTimeout(250);
    const scroller = page.locator("#portfolio-chat-panel > div").first();
    assert.equal(await scroller.evaluate((node) => node.scrollTop), 0);
    assert.equal(await page.getByRole("heading", { name: "Hi, I'm Haris AI." }).isVisible(), true);
  } finally {
    await browser.close();
  }
});

test("closing a pending chat cancels its request and restores launcher focus", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.__chatAborted = false;
      window.fetch = (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => { window.__chatAborted = true; reject(new DOMException("Aborted", "AbortError")); });
      });
    });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    await page.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("Can we talk about projects?");
    await page.getByRole("button", { name: "Send chat message" }).click();
    await page.getByRole("button", { name: "Stop generating response" }).waitFor();
    await page.getByRole("button", { name: "Close chat" }).click();
    assert.equal(await page.evaluate(() => window.__chatAborted), true);
    assert.equal(await page.getByRole("button", { name: "Toggle chat" }).evaluate((node) => document.activeElement === node), true);
  } finally {
    await browser.close();
  }
});

test("assistant replies display readable Markdown and only trusted links", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.route("**/api/ai/chat", (route) => route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "### Latest post\n\nA concise summary with **emphasis**.\n\n- First point\n- Read [the article](/blog/example-post) or /contact.\n\n[Untrusted](javascript:alert(1)) <script>alert(1)</script>", sources: [{ title: "Example post", path: "/blog/example-post" }] }),
    }));
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    await page.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("latest blog");
    await page.getByRole("button", { name: "Send chat message" }).click();
    const panel = page.locator("#portfolio-chat-panel");
    await panel.getByRole("heading", { name: "Latest post" }).waitFor();
    assert.equal(await panel.locator("li").count(), 2);
    assert.equal(await panel.locator("strong").innerText(), "emphasis");
    assert.equal(await panel.locator('a[href="/blog/example-post"]').count(), 2);
    assert.equal(await panel.locator('a[href="/contact"]').count(), 1);
    assert.equal(await panel.locator('a[href^="javascript:"]').count(), 0);
    assert.equal(await panel.locator("script").count(), 0);
    const box = await panel.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 321);
  } finally {
    await browser.close();
  }
});

test("an SSE connection ending without done shows retry rather than a finished answer", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/api/ai/chat", (route) => route.fulfill({
      status: 200, headers: { "content-type": "text/event-stream" },
      body: 'event: delta\ndata: {"text":"Incomplete answer"}\n\n',
    }));
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    await page.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("Tell me about the work");
    await page.getByRole("button", { name: "Send chat message" }).click();
    await page.getByRole("alert").getByText("The answer was interrupted. Please retry.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Retry question" }).count(), 1);
  } finally {
    await browser.close();
  }
});
