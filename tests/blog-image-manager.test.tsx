import assert from "node:assert/strict";
import Module from "node:module";
import test from "node:test";
import React from "react";
import { Window } from "happy-dom";
import type { BlogMediaItem } from "../app/components/admin/BlogImageManager";

const browser = new Window({ url: "http://localhost:3000" });
Object.assign(globalThis, {
  window: browser,
  self: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Node: browser.Node,
  MutationObserver: browser.MutationObserver,
  requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
  cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// UI tests isolate the MDX parser, whose ESM-only dependencies cannot be required by tsx's CJS test runner.
const moduleLoader = Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown };
const originalLoad = moduleLoader._load;
moduleLoader._load = function (request, parent, isMain) {
  if (request.includes("blog-image-urls")) return { blogImageUrls: (content: string) => [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]) };
  if (request === "next/image") return { __esModule: true, default: ({ src, alt }: { src: string; alt: string }) => React.createElement("img", { src, alt }) };
  return originalLoad.call(this, request, parent, isMain);
};

const image = (id: string) => ({ id, url: `/blog/${id}.png`, secure_url: `/blog/${id}.png`, alt_text: `Image ${id}` });

test("post image grid selects a cover, copies links, batches uploads and guards deletion", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { BlogImageManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/BlogImageManager"),
  ]);
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  let uploads = 0;
  globalThis.fetch = async (input, init) => {
    requests.push(`${init?.method || "GET"} ${input}`);
    if (String(input) === "/api/admin/media/upload") return Response.json({ data: image(`uploaded-${++uploads}`) });
    if (init?.method === "DELETE") return Response.json({ success: true });
    return Response.json({ data: [image("first"), image("second"), image("article")], count: 3 });
  };
  let copied = "";
  Object.defineProperty(browser.navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copied = text; } } });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let latest: BlogMediaItem[] = [];
  let cover = "";
  const availability: boolean[] = [];
  const Harness = () => {
    const [images, setImages] = React.useState<BlogMediaItem[]>([]);
    const [coverUrl, setCoverUrl] = React.useState("");
    return React.createElement(BlogImageManager, {
      postId: "00000000-0000-4000-8000-000000000000", images,
      onImagesChange: (next) => { latest = next; setImages(next); },
      onAvailabilityChange: (value) => availability.push(value), coverUrl,
      content: "![Article](/blog/article.png)",
      onCoverChange: (selected) => { cover = selected?.url || ""; setCoverUrl(cover); },
    });
  };
  const button = (label: string, card?: Element) => [...(card || host).querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.trim() === label)!;
  try {
    await act(async () => { root.render(React.createElement(Harness)); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.deepEqual(availability, [false, true]);
    assert.equal(requests[0], "GET /api/admin/blogs/images?postId=00000000-0000-4000-8000-000000000000");
    const row = host.querySelector('[role="region"][aria-label="Post image thumbnails"]')!;
    assert.match(row.className, /grid/);
    assert.equal(row.children.length, 3);
    const first = row.children[0];
    const second = row.children[1];
    await act(async () => button("Make cover", first).click());
    assert.equal(cover, image("first").url);
    assert.equal(first.querySelector('[aria-pressed="true"]')?.textContent?.trim(), "Thumbnail cover selected");
    await act(async () => button("Copy link", second).click());
    assert.equal(copied, image("second").url);
    assert.match(host.textContent || "", /Image link copied to clipboard/);
    Object.defineProperty(browser.navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } });
    await act(async () => button("Copy link", second).click());
    assert.match(host.textContent || "", /Could not copy the image link/);
    await act(async () => button("Remove", first).click());
    assert.match(host.textContent || "", /Choose another cover or remove this image from MDX/);
    await act(async () => button("Remove", row.children[2]).click());
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(requests.length, 1);
    const uploadInput = host.querySelector<HTMLInputElement>('section input[type="file"]')!;
    assert.equal(uploadInput.multiple, true);
    Object.defineProperty(uploadInput, "files", { configurable: true, value: [new browser.File(["image"], "one.png", { type: "image/png" }), new browser.File(["image"], "two.png", { type: "image/png" })] });
    await act(async () => { uploadInput.dispatchEvent(new browser.Event("change", { bubbles: true }) as unknown as Event); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(requests.filter((request) => request === "POST /api/admin/media/upload").length, 2);
    assert.deepEqual(latest.map((item) => item.id), ["first", "second", "article", "uploaded-1", "uploaded-2"]);
    await act(async () => button("Remove", row.children[1]).click());
    const dialog = document.querySelector('[role="dialog"]')!;
    const confirm = button("Remove permanently", dialog);
    assert.equal(confirm.disabled, true);
    const input = dialog.querySelector<HTMLInputElement>("input")!;
    await act(async () => { Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, "DELETE"); input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event); });
    await act(async () => { confirm.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.deepEqual(latest.map((item) => item.id), ["first", "article", "uploaded-1", "uploaded-2"]);
    assert.ok(requests.some((request) => /DELETE \/api\/admin\/media\?id=second&detach_blog_post_id=/.test(request)));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("image manager caps additions at 20 and keeps failed deletion attached", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { BlogImageManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/BlogImageManager"),
  ]);
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    requests.push(`${init?.method || "GET"} ${input}`);
    if (init?.method === "DELETE") return Response.json({ error: "Image is in use by another post" }, { status: 409 });
    return Response.json({ data: Array.from({ length: 20 }, (_, index) => image(String(index))) });
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let latest: BlogMediaItem[] = [];
  try {
    await act(async () => { root.render(React.createElement(BlogImageManager, {
      postId: "00000000-0000-4000-8000-000000000000", images: [],
      onImagesChange: (images) => { latest = images; }, onAvailabilityChange: () => {},
      coverUrl: "", content: "", onCoverChange: () => {},
    })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    // Re-render with the controlled parent value, as BlogForm does.
    await act(async () => root.render(React.createElement(BlogImageManager, {
      postId: "00000000-0000-4000-8000-000000000000", images: latest,
      onImagesChange: (images) => { latest = images; }, onAvailabilityChange: () => {},
      coverUrl: "", content: "", onCoverChange: () => {},
    })));
    assert.equal(host.querySelector<HTMLInputElement>('section input[type="file"]')?.disabled, true);
    assert.match(host.textContent || "", /20 \/ 20 attached/);
    const first = host.querySelector('[role="region"]')!.children[0];
    await act(async () => [...first.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.trim() === "Remove")!.click());
    assert.ok(document.querySelector('[role="dialog"]'));
    assert.equal(requests.length, 1, "no deletion before confirmation");
    await act(async () => {
      const input = document.querySelector<HTMLInputElement>('#admin-confirm-text')!;
      Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")!.set!.call(input, "DELETE");
      input.dispatchEvent(new browser.Event("input", { bubbles: true }) as unknown as Event);
    });
    await act(async () => {
      [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Remove permanently")!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.match(requests[1], /DELETE \/api\/admin\/media\?id=0&detach_blog_post_id=00000000-0000-4000-8000-000000000000/);
    assert.equal(latest.length, 20);
    assert.match(host.textContent || "", /Image is in use by another post/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("a failed batch leaves confirmed uploads visible and reports the partial result", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { BlogImageManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/BlogImageManager"),
  ]);
  const originalFetch = globalThis.fetch;
  let uploads = 0;
  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") return ++uploads === 1 ? Response.json({ data: image("first-upload") }) : Response.json({ error: "Upload unavailable" }, { status: 503 });
    return Response.json({ data: [] });
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let latest: BlogMediaItem[] = [];
  const Harness = () => {
    const [images, setImages] = React.useState<BlogMediaItem[]>([]);
    return React.createElement(BlogImageManager, { images, onImagesChange: (next) => { latest = next; setImages(next); }, onAvailabilityChange: () => {}, coverUrl: "", content: "", onCoverChange: () => {} });
  };
  try {
    await act(async () => { root.render(React.createElement(Harness)); await new Promise((resolve) => setTimeout(resolve, 0)); });
    const input = host.querySelector<HTMLInputElement>('section input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new browser.File(["image"], "one.png", { type: "image/png" }), new browser.File(["image"], "two.png", { type: "image/png" })] });
    await act(async () => { input.dispatchEvent(new browser.Event("change", { bubbles: true }) as unknown as Event); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(uploads, 2);
    assert.deepEqual(latest.map((item) => item.id), ["first-upload"]);
    assert.match(host.textContent || "", /1 of 2 images uploaded/);
    assert.match(host.textContent || "", /Uploaded files remain in the library/);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});

test("missing migration leaves post attachments untouched and picker unavailable", async () => {
  const React = await import("react");
  const [{ createRoot }, { act }, { BlogImageManager }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"), import("../app/components/admin/BlogImageManager"),
  ]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: "Migration missing" }, { status: 503 });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let changed = false;
  const availability: boolean[] = [];
  try {
    await act(async () => { root.render(React.createElement(BlogImageManager, {
      images: [image("saved")], onImagesChange: () => { changed = true; },
      onAvailabilityChange: (value) => availability.push(value), coverUrl: "", content: "",
      onCoverChange: () => {},
    })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(changed, false);
    assert.deepEqual(availability, [false]);
    assert.match(host.textContent || "", /requires the reviewed database migration/);
    assert.match(host.textContent || "", /Image management is unavailable/);
    assert.equal(host.querySelector('[aria-label="Post image thumbnails"]'), null);
    assert.equal(host.querySelector('section input[type="file"]'), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = originalFetch;
  }
});
