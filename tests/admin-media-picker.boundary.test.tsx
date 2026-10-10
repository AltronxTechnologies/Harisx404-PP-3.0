import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/media" });
Object.assign(globalThis, {
  window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
  Element: browser.Element, Node: browser.Node, MutationObserver: browser.MutationObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
});
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("picker stays open during upload and reports the resulting library asset", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { MediaPickerModal }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/MediaPickerModal"),
  ]);
  const originalFetch = globalThis.fetch;
  const originalObjectUrl = URL.createObjectURL;
  URL.createObjectURL = () => { throw new Error("No browser encoder in this DOM test"); };
  let finishUpload!: (response: Response) => void;
  let closes = 0;
  let uploaded = 0;
  const states: boolean[] = [];
  globalThis.fetch = async (_url, options) => options?.method === "POST"
    ? new Promise<Response>((resolve) => { finishUpload = resolve; })
    : Response.json({ data: [], count: 0 });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(React.createElement(MediaPickerModal, {
      isOpen: true, onClose: () => { closes++; }, onSelect: () => {},
      onUploaded: () => { uploaded++; }, onUploadingChange: (value: boolean) => { states.push(value); },
    })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Upload"))!.click());
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["image"], "picture.png", { type: "image/png" })] });
    await act(async () => input.dispatchEvent(new browser.Event("change", { bubbles: true }) as unknown as Event));
    for (let attempt = 0; attempt < 20 && !finishUpload; attempt++) await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(typeof finishUpload, "function");
    const close = host.querySelector<HTMLButtonElement>('[aria-label="Close media picker"]')!;
    assert.equal(close.disabled, true);
    assert.equal([...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Cancel")!.disabled, true);
    await act(async () => document.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Escape", bubbles: true }) as unknown as Event));
    assert.equal(closes, 0);
    const leaving = new browser.Event("beforeunload", { cancelable: true });
    browser.dispatchEvent(leaving);
    assert.equal(leaving.defaultPrevented, true);
    await act(async () => { finishUpload(Response.json({ data: { id: "image-1", url: "/blog/favicon_download_page.jpeg", secure_url: "/blog/favicon_download_page.jpeg", original_filename: "picture.png" } })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(uploaded, 1);
    assert.deepEqual(states, [true, false]);
    assert.equal(close.disabled, false);
    assert.ok(host.querySelector('[aria-label="Select picture.png"]'));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalObjectUrl;
  }
});

test("a stale library response cannot overwrite a newer opening", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { MediaPickerModal }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/MediaPickerModal"),
  ]);
  const originalFetch = globalThis.fetch;
  const pending: Array<(response: Response) => void> = [];
  globalThis.fetch = async () => new Promise<Response>((resolve) => { pending.push(resolve); });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const props = { onClose: () => {}, onSelect: () => {} };
  const item = (name: string) => ({ id: name, url: "/blog/favicon_download_page.jpeg", secure_url: "/blog/favicon_download_page.jpeg", original_filename: name });
  try {
    await act(async () => root.render(React.createElement(MediaPickerModal, { ...props, isOpen: true })));
    assert.equal(pending.length, 1);
    await act(async () => root.render(React.createElement(MediaPickerModal, { ...props, isOpen: false })));
    await act(async () => root.render(React.createElement(MediaPickerModal, { ...props, isOpen: true })));
    assert.equal(pending.length, 2);
    await act(async () => { pending[1](Response.json({ data: [item("new.png")], count: 1 })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => { pending[0](Response.json({ data: [item("old.png")], count: 1 })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.ok(host.querySelector('[aria-label="Select new.png"]'));
    assert.equal(host.querySelector('[aria-label="Select old.png"]'), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("a failed library read offers in-place Retry", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { MediaPickerModal }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/MediaPickerModal"),
  ]);
  const originalFetch = globalThis.fetch;
  let reads = 0;
  globalThis.fetch = async () => ++reads === 1
    ? Response.json({ error: "Unavailable" }, { status: 503 })
    : Response.json({ data: [], count: 0 });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(React.createElement(MediaPickerModal, { isOpen: true, onClose: () => {}, onSelect: () => {} })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.ok(host.querySelector('[role="alert"]'));
    await act(async () => { [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Retry loading")!.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(reads, 2);
    assert.match(host.textContent || "", /No media found/);
    assert.equal(host.querySelector('[role="alert"]'), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("a small WebP rejected with non-JSON 413 reports the request boundary without claiming the file exceeded the app limit", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { MediaPickerModal }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/MediaPickerModal"),
  ]);
  const originalFetch = globalThis.fetch;
  let uploaded = 0;
  globalThis.fetch = async (_url, options) => options?.method === "POST"
    ? new Response("<html>Request rejected</html>", { status: 413, headers: { "content-type": "text/html" } })
    : Response.json({ data: [], count: 0 });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(React.createElement(MediaPickerModal, { isOpen: true, onClose: () => {}, onSelect: () => {}, onUploaded: () => { uploaded++; } })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Upload"))!.click());
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File([new Uint8Array(900_000)], "small.webp", { type: "image/webp" })] });
    await act(async () => { input.dispatchEvent(new browser.Event("change", { bubbles: true }) as unknown as Event); await new Promise((resolve) => setTimeout(resolve, 0)); });
    for (let attempt = 0; attempt < 20 && !host.querySelector('[role="alert"]'); attempt++) {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    }
    assert.match(host.querySelector('[role="alert"]')?.textContent || "", /HTTP 413.*even when the file is small/);
    assert.equal(uploaded, 0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
