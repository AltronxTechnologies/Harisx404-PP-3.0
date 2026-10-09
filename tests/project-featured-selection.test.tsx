import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/projects" });
Object.assign(globalThis, {
  window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
  Node: browser.Node, MutationObserver: browser.MutationObserver,
});
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Home selection supports more than six projects and saves the numbered order once", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { FeaturedProjectsManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/FeaturedProjectsManager"),
  ]);
  const projects = Array.from({ length: 7 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    title: `Project ${i + 1}`, slug: `project-${i + 1}`, status: "published",
    featured: true, display_order: i + 1, updated_at: "2026-10-08T00:00:00Z",
  }));
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const originalFetch = globalThis.fetch;
  const requests: unknown[] = [];
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "/api/admin/projects/featured");
    requests.push(JSON.parse(String(options?.body)));
    return Response.json({ success: true });
  };
  try {
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => { refreshes++; } } as any }, React.createElement(FeaturedProjectsManager, { projects }))));
    assert.equal(host.querySelectorAll("ol > li").length, 7);
    assert.match(host.textContent || "", /7 selected/);
    assert.equal(requests.length, 0);
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Move Project 7 up"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Remove Project 1 from Home"]')!.click());
    await act(async () => [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Project 1")!.click());
    assert.equal(host.querySelectorAll("ol > li").length, 7);
    await act(async () => { [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Save Home selection")!.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(requests.length, 1);
    assert.deepEqual((requests[0] as { ids: string[] }).ids, [2, 3, 4, 5, 7, 6, 1].map((i) => projects[i - 1].id));
    assert.equal((requests[0] as { expected: unknown[] }).expected.length, 7);
    assert.equal(refreshes, 1);
    assert.match(host.textContent || "", /Home selection saved/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
