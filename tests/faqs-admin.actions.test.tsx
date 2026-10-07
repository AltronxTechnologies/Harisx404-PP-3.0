import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/faqs" });
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Node: browser.Node,
  MutationObserver: browser.MutationObserver,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("FAQ visibility and deletion confirm before writes and report failures", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { FaqVisibilityToggle, FaqSectionToggle }, { DeleteFaqButton }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/FaqToggles"),
    import("../app/components/admin/DeleteFaqButton"),
  ]);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const originalFetch = globalThis.fetch;
  const requests: { method: string; body?: unknown }[] = [];
  let refreshes = 0;
  globalThis.fetch = async (_input, init) => {
    requests.push({ method: init?.method || "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Response.json({ error: "Review service unavailable" }, { status: 503 });
  };
  try {
    const id = "00000000-0000-4000-8000-000000000001";
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => { refreshes++; } } as any },
      React.createElement(React.Fragment, null,
        React.createElement(FaqVisibilityToggle, { id, isVisible: true, question: "Review FAQ?" }),
        React.createElement(FaqSectionToggle, { enabled: true }),
        React.createElement(DeleteFaqButton, { id, question: "Review FAQ?" })) )));
    const click = async (button: HTMLButtonElement) => act(async () => button.click());
    await click(host.querySelector<HTMLButtonElement>('[aria-label="Hide FAQ: Review FAQ?"]')!);
    let dialog = document.querySelector('[role="dialog"]')!;
    await click([...dialog.querySelectorAll("button")].find((button) => button.textContent === "Cancel")!);
    assert.equal(requests.length, 0);
    await click(host.querySelector<HTMLButtonElement>('[aria-label="Hide FAQ: Review FAQ?"]')!);
    dialog = document.querySelector('[role="dialog"]')!;
    await act(async () => { [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Hide FAQ")!.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.deepEqual(requests[0], { method: "PUT", body: { id, is_visible: false } });
    assert.match(host.textContent || "", /Review service unavailable/);

    await click(host.querySelector<HTMLButtonElement>('[role="switch"]')!);
    dialog = document.querySelector('[role="dialog"]')!;
    await act(async () => { [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Hide section")!.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.deepEqual(requests[1], { method: "PATCH", body: { show_faq_section: false } });

    await click(host.querySelector<HTMLButtonElement>('[aria-label="Delete FAQ: Review FAQ?"]')!);
    dialog = document.querySelector('[role="dialog"]')!;
    const confirm = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Delete permanently")!;
    assert.equal(dialog.querySelector("input"), null);
    assert.equal(confirm.disabled, false);
    await act(async () => { confirm.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(requests[2].method, "DELETE");
    assert.equal(refreshes, 0);
    assert.match(host.textContent || "", /Review service unavailable/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
