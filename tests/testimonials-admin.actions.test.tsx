import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/testimonials" });
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Node: browser.Node,
  MutationObserver: browser.MutationObserver,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Testimonial moderation and deletion require confirmation and report failures", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { TestimonialModerationActions }, { DeleteTestimonialButton }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/TestimonialModerationActions"),
    import("../app/components/admin/DeleteTestimonialButton"),
  ]);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const originalFetch = globalThis.fetch;
  let writes = 0;
  let refreshes = 0;
  globalThis.fetch = async () => {
    writes++;
    return Response.json({ error: "Review service unavailable" }, { status: 503 });
  };
  try {
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: { refresh: () => { refreshes++; } } as any },
      React.createElement(React.Fragment, null,
        React.createElement(TestimonialModerationActions, { id: "00000000-0000-4000-8000-000000000001" }),
        React.createElement(DeleteTestimonialButton, { id: "00000000-0000-4000-8000-000000000001", name: "Review visitor" })) )));
    const click = async (button: HTMLButtonElement) => act(async () => button.click());
    await click([...host.querySelectorAll("button")].find((button) => button.textContent === "Approve")!);
    let dialog = document.querySelector('[role="dialog"]')!;
    assert.match(dialog.textContent || "", /visible in the public homepage carousel/);
    await click([...dialog.querySelectorAll("button")].find((button) => button.textContent === "Cancel")!);
    assert.equal(writes, 0);
    await click(host.querySelector<HTMLButtonElement>('[aria-label="Delete testimonial from Review visitor"]')!);
    dialog = document.querySelector('[role="dialog"]')!;
    const confirm = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Delete permanently")!;
    assert.equal(confirm.disabled, true);
    await act(async () => {
      const input = dialog.querySelector("input")!;
      Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, "DELETE");
      input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event);
    });
    assert.equal(confirm.disabled, false);
    await act(async () => { confirm.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(writes, 1);
    assert.equal(refreshes, 0);
    assert.match(host.textContent || "", /Review service unavailable/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
