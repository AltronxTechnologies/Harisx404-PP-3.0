import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogArticleImage } from "../app/components/blog/BlogArticleImage";
import { isAllowedBlogImageUrl } from "../app/components/blog/blogImage";

function render(props: Parameters<typeof BlogArticleImage>[0]) {
  return renderToStaticMarkup(createElement("p", null, createElement(BlogArticleImage, props)));
}

test("local article images retain their styling and supplied alt without a caption", () => {
  const html = render({ src: "/blog/favicon_for_app.jpeg", alt: "Favicon for app directory" });
  assert.match(html, /alt="Favicon for app directory"/);
  assert.match(html, /drama-shadow rounded-xl w-full h-auto/);
  assert.match(html, /width="800" height="450"/);
  assert.doesNotMatch(html, /View source|text-center text-sm text-text-secondary/);
});

test("Markdown title appears as a caption inside valid paragraph content", () => {
  const html = render({ src: "/blog/favicon_for_app.jpeg", alt: "Favicon", title: "App directory example" });
  assert.match(html, /<p><span class="block">.*<img[^>]*alt="Favicon"[^>]*>.*<span class="mt-2 block text-center text-sm text-text-secondary">App directory example<\/span><\/span><\/p>/);
  assert.doesNotMatch(html, /<figure|<figcaption|<p[^>]*>.*<p/);
});

test("unsupported HTTPS hosts render as safe source links with only supplied labels", () => {
  const src = "https://res.craft.do/user/image";
  const html = render({ src, alt: "JAMstack diagram", title: "Diagram" });
  assert.match(html, /href="https:\/\/res\.craft\.do\/user\/image"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /JAMstack diagram · View source/);
  assert.match(html, /Diagram<\/span>/);
  assert.doesNotMatch(html, /<img/);

  const noAlt = render({ src: "https://img.devrant.com/image" });
  assert.match(noAlt, /View image source/);
  assert.doesNotMatch(noAlt, /External article image|<span/);

  const customPort = render({ src: "https://images.unsplash.com:8443/photo.jpg", alt: "Photo" });
  assert.match(customPort, /href="https:\/\/images\.unsplash\.com:8443\/photo\.jpg"/);
  assert.doesNotMatch(customPort, /<img/);
});

test("missing, malformed and unsafe sources never become images or links", () => {
  for (const src of [undefined, "", "data:image/svg+xml;base64,AAAA", "javascript:alert(1)", "//evil.example/image", "http://evil.example/image", "https://user:pass@evil.example/image", "https://user:pass@images.unsplash.com/image", "not-a-url"]) {
    assert.equal(render({ src, alt: "Supplied alt", title: "Supplied title" }), "<p></p>", String(src));
  }
});

test("allowed Blog image hosts reject credentials and custom ports", () => {
  assert.equal(isAllowedBlogImageUrl("https://images.unsplash.com/photo.jpg"), true);
  assert.equal(isAllowedBlogImageUrl("https://user:pass@images.unsplash.com/photo.jpg"), false);
  assert.equal(isAllowedBlogImageUrl("https://images.unsplash.com:8443/photo.jpg"), false);
});
