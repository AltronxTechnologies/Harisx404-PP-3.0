import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/projects" });
Object.assign(globalThis, {
  window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
  Element: browser.Element, Node: browser.Node, MutationObserver: browser.MutationObserver,
});
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Projects page order moves one published project at a time and saves a complete snapshot", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { ProjectIndexOrderManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/ProjectIndexOrderManager"),
  ]);
  const projects = [
    { id: "00000000-0000-4000-8000-000000000001", title: "First", status: "published", index_order: -1, updated_at: "2026-10-08T00:00:00Z" },
    { id: "00000000-0000-4000-8000-000000000002", title: "Second", status: "published", index_order: 1, updated_at: "2026-10-08T00:00:00Z" },
    { id: "00000000-0000-4000-8000-000000000003", title: "Draft", status: "draft", index_order: -2, updated_at: "2026-10-08T00:00:00Z" },
  ];
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const originalFetch = globalThis.fetch;
  const requests: { ids: string[]; expected: { id: string }[] }[] = [];
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "/api/admin/projects/order");
    requests.push(JSON.parse(String(options?.body)));
    return Response.json({ success: true });
  };
  try {
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => { refreshes++; } } as any }, React.createElement(ProjectIndexOrderManager, { projects }))));
    assert.equal(host.querySelectorAll("ol > li").length, 2);
    assert.match(host.textContent || "", /New projects appear first automatically/);
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Move Second up on Projects page"]')!.click());
    assert.equal(host.querySelector("ol > li")?.textContent?.includes("Second"), true);
    const leaving = new browser.Event("beforeunload", { cancelable: true });
    browser.dispatchEvent(leaving);
    assert.equal(leaving.defaultPrevented, true);
    await act(async () => { [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Save Projects order")!.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.deepEqual(requests[0].ids, [projects[1].id, projects[0].id]);
    assert.equal(requests[0].expected.length, 3);
    assert.equal(refreshes, 1);
    assert.match(host.textContent || "", /Projects page order saved/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
