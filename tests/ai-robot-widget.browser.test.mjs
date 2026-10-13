import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("robot launcher, outside click, Escape and header swipe preserve focus and abort", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    const launcher = page.getByRole("button", { name: "Toggle chat" });
    await launcher.waitFor();
    assert.equal(await launcher.locator("svg").count(), 1);
    assert.notEqual(await launcher.locator(".robot-eyes").evaluate((node) => getComputedStyle(node).animationName), "none");
    const launcherBox = await launcher.boundingBox();
    assert.ok(launcherBox && launcherBox.width === 56 && launcherBox.height === 56);
    assert.equal((await launcher.innerText()).trim(), "");
    await launcher.click();
    const panel = page.locator("#portfolio-chat-panel");
    const box = await panel.boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 376 && box.y + box.height <= 668);
    await page.locator("body").click({ position: { x: 4, y: 4 } });
    assert.equal(await panel.count(), 0);
    await launcher.click();
    await page.evaluate(() => {
      window.__robotAborted = false;
      window.fetch = (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          window.__robotAborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    await panel.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("Projects?");
    await panel.getByRole("button", { name: "Send chat message" }).click();
    await panel.getByRole("button", { name: "Stop generating response" }).waitFor();
    await panel.locator("header").evaluate((header) => {
      const touch = (x, y) => new Touch({ identifier: 1, target: header, clientX: x, clientY: y });
      header.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(170, 180)] }));
      header.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [touch(170, 290)] }));
    });
    assert.equal(await panel.count(), 0);
    assert.equal(await page.evaluate(() => window.__robotAborted), true);
    await launcher.click();
    await page.keyboard.press("Escape");
    assert.equal(await panel.count(), 0);
    assert.equal(await launcher.evaluate((node) => document.activeElement === node), true);
    await context.close();
  } finally {
    await browser.close();
  }
});

test("SSE sources before and after deltas render only allowlisted local labeled links", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/api/ai/chat", (route) => route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: 'event: sources\ndata: {"sources":[{"title":"Project overview","path":"/projects"},{"title":"Malicious","path":"//evil.com"}]}\n\nevent: delta\ndata: {"text":"Read **this**"}\n\nevent: sources\ndata: {"sources":[{"title":"Case study","path":"/projects/tourmate"},{"title":"External","path":"https://example.com"}]}\n\nevent: done\ndata: {}\n\n',
    }));
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).click();
    const panel = page.locator("#portfolio-chat-panel");
    await panel.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("Tell me more");
    await panel.getByRole("button", { name: "Send chat message" }).click();
    await panel.getByRole("link", { name: "Case study" }).waitFor();
    assert.equal(await panel.locator("strong").innerText(), "this");
    assert.equal(await panel.getByRole("link", { name: "Case study" }).getAttribute("href"), "/projects/tourmate");
    assert.equal(await panel.getByRole("link", { name: "External" }).count(), 0);
    assert.equal(await panel.getByRole("link", { name: "Project overview" }).count(), 0);
  } finally {
    await browser.close();
  }
});

test("JSON sources and one-time idle hint respect reduced motion and session dismissal", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 320, height: 568 } });
    const page = await context.newPage();
    await page.clock.install();
    await page.route("**/api/ai/chat", (route) => route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "See /contact", sources: [{ title: "Contact page", path: "/contact" }, { title: "Bad", path: "javascript:alert(1)" }] }),
    }));
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    const launcher = page.getByRole("button", { name: "Toggle chat" });
    await launcher.waitFor();
    assert.equal(await launcher.locator(".robot-eyes").evaluate((node) => getComputedStyle(node).animationName), "none");
    await page.clock.runFor(12500);
    const hint = page.getByRole("status").filter({ hasText: "Need a hand? Ask me." });
    await hint.waitFor();
    const hintLayout = await hint.evaluate((node) => {
      const label = node.querySelector("button").getBoundingClientRect();
      return { width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, labelHeight: label.height };
    });
    assert.ok(hintLayout.width <= 296 && hintLayout.height <= 48 && hintLayout.labelHeight <= 36);
    await page.getByRole("button", { name: "Dismiss assistant tip" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).waitFor();
    await page.clock.runFor(13000);
    assert.equal(await page.getByRole("button", { name: "Dismiss assistant tip" }).count(), 0);
    await launcher.click();
    const panel = page.locator("#portfolio-chat-panel");
    await panel.getByRole("textbox", { name: "Ask the portfolio assistant" }).fill("How to reach out?");
    await panel.getByRole("button", { name: "Send chat message" }).click();
    await panel.getByRole("link", { name: "Contact page" }).waitFor();
    assert.equal(await panel.getByRole("link", { name: "Bad" }).count(), 0);
    assert.equal(await panel.locator('a[href="/contact"]').count(), 2);
    await context.close();
  } finally {
    await browser.close();
  }
});

test("the one-line help pill opens the assistant without covering the robot", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.clock.install();
    await page.goto(`${baseUrl}/links`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Toggle chat" }).waitFor();
    await page.clock.runFor(12500);
    const pill = page.getByRole("button", { name: "Need a hand? Ask me." });
    await pill.waitFor();
    await pill.click();
    await page.getByRole("dialog", { name: "Haris AI assistant" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Dismiss assistant tip" }).count(), 0);
  } finally {
    await browser.close();
  }
});
