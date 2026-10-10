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

test("Projects order scrolls after five measured rows, including long titles and reordering", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { AppRouterContext }, { ProjectIndexOrderManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/ProjectIndexOrderManager"),
  ]);
  const oldObserver = globalThis.ResizeObserver;
  const oldRect = browser.HTMLElement.prototype.getBoundingClientRect;
  class MeasuredObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe() { this.callback([], this as unknown as ResizeObserver); }
    disconnect() {}
  }
  globalThis.ResizeObserver = MeasuredObserver as unknown as typeof ResizeObserver;
  browser.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.tagName !== "LI" || this.parentElement?.getAttribute("aria-label") !== "Projects page order list") return oldRect.call(this);
    const rows = [...this.parentElement.children];
    const height = (row: Element) => row.textContent?.includes("Long Project") ? 102 : 70;
    const top = rows.slice(0, rows.indexOf(this)).reduce((sum, row) => sum + height(row) + 8, 0);
    return { ...oldRect.call(this), top, bottom: top + height(this) } as DOMRect;
  };
  const projects = Array.from({ length: 7 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    title: index === 5 ? "Long Project 6" : `Project ${index + 1}`,
    status: "published", index_order: index + 1, updated_at: "2026-10-08T00:00:00Z",
  }));
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => {} } as any }, React.createElement(ProjectIndexOrderManager, { projects }))));
    const list = host.querySelector<HTMLOListElement>('ol[aria-label="Projects page order list"]')!;
    assert.equal(list.children.length, 7);
    assert.equal(list.style.maxHeight, "382px");
    assert.match(list.className, /overflow-y-auto/);
    assert.equal(list.tabIndex, 0);
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Move Long Project 6 up on Projects page"]')!.click());
    assert.equal(list.style.maxHeight, "414px");
    const fiveRows = projects.slice(0, 5).map((project) => ({ ...project, title: `Long Project ${project.id}` }));
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => {} } } as any, React.createElement(ProjectIndexOrderManager, { key: "five", projects: fiveRows }))));
    assert.equal(host.querySelector<HTMLOListElement>('ol[aria-label="Projects page order list"]')!.style.maxHeight, "");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    browser.HTMLElement.prototype.getBoundingClientRect = oldRect;
    globalThis.ResizeObserver = oldObserver;
  }
});
