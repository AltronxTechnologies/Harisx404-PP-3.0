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

test("Media pagination preserves loaded images when a later page fails and can retry", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { default: Media }] = await Promise.all([
    import("react-dom/client"),
    import("react-dom/test-utils"),
    import("../app/admin/(dashboard)/media/page"),
  ]);
  const originalFetch = globalThis.fetch;
  const item = (id: number) => ({
    id: String(id), url: "/brand/logo-wide.png", secure_url: "", public_id: `test/${id}`,
    alt_text: `Test image ${id}`, format: "png", width: 1, height: 1, bytes: 128,
    created_at: "2026-01-01T00:00:00Z",
  });
  let failNext = true;
  globalThis.fetch = async (input) => {
    const offset = new URL(String(input), "http://localhost:3000").searchParams.get("offset");
    if (offset === "0") return Response.json({ data: [item(1)], count: 2 });
    if (failNext) {
      failNext = false;
      return Response.json({ error: "Unavailable" }, { status: 503 });
    }
    return Response.json({ data: [item(2)], count: 2 });
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(React.createElement(Media)); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.match(host.textContent || "", /Showing 1 of 2 files/);
    assert.match(host.textContent || "", /Test image 1/);
    const loadMore = () => [...host.querySelectorAll("button")].find((button) => button.textContent?.includes("Load more images"));
    await act(async () => { loadMore()?.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.match(host.textContent || "", /More images could not be loaded/);
    assert.match(host.textContent || "", /Showing 1 of 2 files/);
    await act(async () => { loadMore()?.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.match(host.textContent || "", /Showing 2 of 2 files/);
    assert.match(host.textContent || "", /Test image 2/);
    assert.doesNotMatch(host.textContent || "", /More images could not be loaded/);
    assert.equal(loadMore(), undefined);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("Media delete keeps an in-use image visible and removes it only after success", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { default: Media }] = await Promise.all([
    import("react-dom/client"),
    import("react-dom/test-utils"),
    import("../app/admin/(dashboard)/media/page"),
  ]);
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  let calls = 0;
  window.confirm = () => true;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "DELETE") {
      calls++;
      return calls === 1
        ? Response.json({ error: "This image is in use by a Blog or Project." }, { status: 409 })
        : Response.json({ success: true });
    }
    return Response.json({ data: [{
      id: "test", url: "/brand/logo-wide.png", secure_url: "", public_id: "test/image",
      alt_text: "Test image.png", format: "png", width: 1, height: 1, bytes: 128,
      created_at: "2026-01-01T00:00:00Z",
    }], count: 1 });
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(React.createElement(Media)); await new Promise((resolve) => setTimeout(resolve, 0)); });
    const deleteButton = () => host.querySelector<HTMLButtonElement>('button[aria-label="Delete Test image.png"]');
    assert.ok(deleteButton());
    await act(async () => { deleteButton()?.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.ok(deleteButton());
    assert.match(host.querySelector('[role="alert"]')?.textContent || "", /in use by a Blog or Project/);
    await act(async () => { deleteButton()?.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(deleteButton(), null);
    assert.match(host.textContent || "", /No media yet/);
    assert.match(host.querySelector('[role="status"]')?.textContent || "", /Image deleted/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
  }
});
