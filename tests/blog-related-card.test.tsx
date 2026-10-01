import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RelatedPostCard } from "../app/components/blog/RelatedPostCard";

test("curated Blog cards have readable titles, a clear action, and no duplicate image label", () => {
  const html = renderToStaticMarkup(createElement(RelatedPostCard, {
    slug: "a-related-article",
    title: "A Related Article",
    summary: "Why this article is worth reading.",
    imageName: "/blog/related-cover.jpeg",
  }));
  assert.match(html, /href="\/blog\/a-related-article"/);
  assert.match(html, /<h3[^>]*>A Related Article<\/h3>/);
  assert.match(html, /Why this article is worth reading/);
  assert.match(html, /Read article/);
  assert.match(html, /alt=""/);
});
