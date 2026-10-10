import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/components/ChatbotWidget.tsx", import.meta.url), "utf8");

test("Launcher button exposes correct accessibility attributes, title, and orb iconography", () => {
  assert.match(source, /aria-label="Toggle chat"/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls="portfolio-chat-panel"/);
  assert.match(source, /title="Ask Haris AI Assistant"/);
  assert.match(source, /<AssistantOrb \/>/);
});

test("AssistantOrb includes responsive styling, SVG gradients, and reduced-motion compliance", () => {
  assert.match(source, /id="orbGrad"/);
  assert.match(source, /id="orbGloss"/);
  assert.match(source, /id="orbVisor"/);
  assert.match(source, /motion-reduce:animate-none/);
  assert.match(source, /motion-reduce:transform-none/);
  assert.match(source, /motion-reduce:hidden/);
});

test("Chat panel enforces responsive bounds, dynamic viewport height, and dialog accessibility", () => {
  assert.match(source, /id="portfolio-chat-panel"/);
  assert.match(source, /aria-label="Haris AI assistant"/);
  assert.match(source, /width: "min\(400px, calc\(100vw - 24px\)\)"/);
  assert.match(source, /100dvh/);
  assert.match(source, /overscroll-contain/);
});

test("Focus management and keyboard behaviors return focus to launcher and support Escape", () => {
  assert.match(source, /toggleRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key === "Enter" && !event\.shiftKey/);
});

test("Scroll-follow behavior implements smart near-bottom tracking and jump-to-latest affordance", () => {
  assert.match(source, /onScroll=\{handleScroll\}/);
  assert.match(source, /aria-label="Jump to latest messages"/);
  assert.match(source, /!isAtBottom && \(isLoading \|\| messages\.length > 0\)/);
  assert.match(source, /scrollToBottom/);
});

test("Offline resilience protects user from silent disconnects", () => {
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /window\.addEventListener\("offline"/);
  assert.match(source, /You appear to be offline/);
});

test("Message rendering is 100% XSS-safe without dangerouslySetInnerHTML and formats markdown safely", () => {
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.match(source, /formatInline/);
  assert.match(source, /localPath\.test/);
});
