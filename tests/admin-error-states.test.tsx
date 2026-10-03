import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000" });
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Node: browser.Node,
  MutationObserver: browser.MutationObserver,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Admin editors do not mistake failed reads for empty data", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { default: Settings }, { default: About }, { default: Media }] = await Promise.all([
    import("react-dom/client"),
    import("react-dom/test-utils"),
    import("../app/admin/(dashboard)/settings/page"),
    import("../app/admin/(dashboard)/about/page"),
    import("../app/admin/(dashboard)/media/page"),
  ]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    for (const [Component, errorText] of [
      [Settings, "Site settings unavailable"],
      [About, "About content unavailable"],
      [Media, "Media could not be loaded"],
    ] as const) {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      try {
        await act(async () => {
          root.render(React.createElement(Component));
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        assert.match(host.textContent || "", new RegExp(errorText));
        assert.ok(host.querySelector('[role="alert"]'));
        assert.ok([...host.querySelectorAll("button")].some((button) => button.textContent?.includes("Retry loading")));
        assert.doesNotMatch(host.textContent || "", /No media yet|Save Settings|Save About/);
      } finally {
        await act(async () => root.unmount());
        host.remove();
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
