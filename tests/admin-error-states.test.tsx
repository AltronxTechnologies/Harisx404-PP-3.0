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

test("Admin delete dialog requires an exact slug before confirming", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AdminConfirmDialog }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/AdminConfirmDialog"),
  ]);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let confirmed = "";
  try {
    await act(async () => root.render(React.createElement(AdminConfirmDialog, {
      open: true, title: "Permanently delete post?", description: "This cannot be undone.", confirmLabel: "Delete permanently",
      confirmText: "example-post", destructive: true, onClose: () => {}, onConfirm: (value) => { confirmed = value; },
    })));
    const dialog = document.querySelector('[role="dialog"]');
    assert.ok(dialog);
    const submit = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Delete permanently")!;
    assert.equal(submit.disabled, true);
    const input = dialog.querySelector("input")!;
    const setValue = async (value: string) => act(async () => {
      Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event);
    });
    await setValue("wrong-slug");
    assert.equal(submit.disabled, true);
    await setValue("example-post");
    assert.equal(submit.disabled, false);
    await act(async () => submit.click());
    assert.equal(confirmed, "example-post");
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

test("Blog deletion announces success only after an authenticated API success", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { BlogArchiveAction }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/admin/(dashboard)/blogs/BlogArchiveAction"),
  ]);
  browser.history.replaceState(null, "", "/admin/blogs");
  const originalFetch = globalThis.fetch;
  const destinations: string[] = [];
  let requests = 0;
  globalThis.fetch = async (_input, init) => {
    requests++;
    assert.equal(init?.method, "DELETE");
    assert.equal(JSON.parse(String(init?.body)).confirm_slug, "review-post");
    return Response.json({ deleted: true });
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    const router = { replace: (href: string) => destinations.push(href), refresh: () => {} };
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: router as any },
      React.createElement(BlogArchiveAction, { post: { id: "00000000-0000-4000-8000-000000000000", slug: "review-post", title: "Review post", status: "archived", updated_at: "2026-01-01T00:00:00.000Z" } }))));
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Permanently delete Review post"]')!.click());
    const input = document.querySelector<HTMLInputElement>("#admin-confirm-text")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, "review-post");
      input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event);
    });
    await act(async () => {
      [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Delete permanently")!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(requests, 1);
    assert.deepEqual(destinations, ["/admin/blogs?notice=deleted"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("Admin editors do not mistake failed reads for empty data", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { default: Settings }, { default: Media }] = await Promise.all([
    import("react-dom/client"),
    import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/admin/(dashboard)/settings/page"),
    import("../app/admin/(dashboard)/media/page"),
  ]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    for (const [Component, errorText] of [
      [Settings, "Site settings unavailable"],
      [Media, "Media could not be loaded"],
    ] as const) {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      try {
        await act(async () => {
          root.render(React.createElement(AppRouterContext.Provider, { value: { push: () => {}, refresh: () => {} } as any }, React.createElement(Component)));
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        assert.match(host.textContent || "", new RegExp(errorText));
        assert.ok(host.querySelector('[role="alert"]'));
        assert.ok([...host.querySelectorAll("button")].some((button) => button.textContent?.includes("Retry loading")));
        assert.doesNotMatch(host.textContent || "", /No media yet|Save Settings/);
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
