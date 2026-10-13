import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/components/ChatbotWidget.tsx", import.meta.url), "utf8");

test("Launcher button exposes correct accessibility attributes, title, and robot iconography", () => {
  assert.match(source, /aria-label="Toggle chat"/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls="portfolio-chat-panel"/);
  assert.match(source, /title="Ask Haris AI Assistant"/);
  assert.match(source, /<AssistantRobot \/>/);
  assert.match(source, /group relative flex size-14 items-center justify-center rounded-full/);
  assert.doesNotMatch(source, /<span className="font-semibold leading-tight tracking-tight">Ask Haris AI/);
});

test("Robot includes shaded SVG and reduced-motion compliance", () => {
  assert.match(source, /id="robotShell"/);
  assert.match(source, /id="robotEye"/);
  assert.match(source, /id="robotVisor"/);
  assert.match(source, /motion-reduce:transform-none/);
  assert.match(source, /prefers-reduced-motion: no-preference/);
});

test("Chat panel enforces responsive bounds, dynamic viewport height, and dialog accessibility", () => {
  assert.match(source, /id="portfolio-chat-panel"/);
  assert.match(source, /aria-label="Haris AI assistant"/);
  assert.match(source, /sm:w-\[min\(420px,calc\(100vw-48px\)\)\]/);
  assert.match(source, /bottom-\[max\(8px,env\(safe-area-inset-bottom\)\)\]/);
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

test("Message rendering uses restricted Markdown and local links without raw HTML", () => {
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.match(source, /allowedElements=/);
  assert.match(source, /ReactMarkdown/);
  assert.match(source, /localPath\.test/);
});
