import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "http://localhost:3000/admin/community-wall?pendingPage=2&reviewedPage=1" });
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Node: browser.Node,
  MutationObserver: browser.MutationObserver,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Community Wall moderation confirms decisions, rejects stale edits, and preserves the current page", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { AppRouterContext }, { CommunityWallModerationActions }] = await Promise.all([
    import("react-dom/client"),
    import("react-dom/test-utils"),
    import("next/dist/shared/lib/app-router-context.shared-runtime"),
    import("../app/components/admin/CommunityWallModerationActions"),
  ]);
  const id = "00000000-0000-4000-8000-000000000001";
  const updatedAt = "2026-10-05T19:00:00.000Z";
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const originalFetch = globalThis.fetch;
  const requests: { method: string; url: string; body?: unknown }[] = [];
  const destinations: string[] = [];
  let refreshes = 0;
  globalThis.fetch = async (input, init) => {
    requests.push({ method: init?.method || "GET", url: String(input), body: init?.body && JSON.parse(String(init.body)) });
    if (init?.method === "PATCH") return Response.json({ error: "This note changed or was removed. Refresh the page before moderating it." }, { status: 409 });
    return Response.json({ success: true });
  };
  try {
    const router = { replace: (href: string) => destinations.push(href), refresh: () => { refreshes++; } };
    await act(async () => root.render(React.createElement(AppRouterContext.Provider, { value: router as any },
      React.createElement(CommunityWallModerationActions, { id, status: "pending", updatedAt, creatorName: "Review visitor" }))));
    const button = (label: string) => [...host.querySelectorAll("button")].find((item) => item.textContent?.trim() === label)!;
    await act(async () => button("Publish").click());
    let dialog = document.querySelector('[role="dialog"]')!;
    assert.match(dialog.textContent || "", /visible on the public wall/);
    assert.equal(requests.length, 0);
    await act(async () => [...dialog.querySelectorAll("button")].find((item) => item.textContent === "Cancel")!.click());
    assert.equal(requests.length, 0);

    await act(async () => button("Publish").click());
    dialog = document.querySelector('[role="dialog"]')!;
    await act(async () => {
      [...dialog.querySelectorAll("button")].find((item) => item.textContent === "Publish note")!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.deepEqual(requests[0], { method: "PATCH", url: "/api/admin/community-wall", body: { id, status: "published", updated_at: updatedAt } });
    assert.match(host.textContent || "", /This note changed or was removed/);
    assert.equal(destinations.length, 0);

    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Delete Review visitor\'s Community Wall note"]')!.click());
    dialog = document.querySelector('[role="dialog"]')!;
    const confirm = [...dialog.querySelectorAll("button")].find((item) => item.textContent === "Delete permanently")!;
    assert.equal(confirm.disabled, true);
    const input = dialog.querySelector("input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, "DELETE");
      input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event);
    });
    assert.equal(confirm.disabled, false);
    await act(async () => { confirm.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(requests.length, 2);
    assert.equal(requests[1].method, "DELETE");
    assert.equal(new URL(requests[1].url, "http://localhost:3000").searchParams.get("updated_at"), updatedAt);
    assert.equal(new URL(requests[1].url, "http://localhost:3000").searchParams.get("id"), id);
    assert.deepEqual(destinations, ["/admin/community-wall?pendingPage=2&reviewedPage=1&notice=deleted"]);
    assert.equal(refreshes, 1);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
