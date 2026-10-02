import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RelatedPostCard } from "../app/components/blog/RelatedPostCard";

const { createElement } = React;
(globalThis as typeof globalThis & { React: typeof React }).React = React;

test("curated Blog cards have readable titles, a clear action, and no duplicate image label", () => {
  const html = renderToStaticMarkup(createElement(RelatedPostCard, {
    slug: "a-related-article",
    title: "A Related Article",
    summary: "Why this article is worth reading.",
    imageName: "/blog/related-cover.jpeg",
    reactionSummary: { total: 3, counts: { like: 2, heart: 1, celebrate: 0, insightful: 0 } },
  }));
  assert.match(html, /href="\/blog\/a-related-article"/);
  assert.match(html, /<h3[^>]*>A Related Article<\/h3>/);
  assert.match(html, /Why this article is worth reading/);
  assert.match(html, /Read article/);
  assert.match(html, /alt=""/);
  assert.match(html, /aria-label="Read A Related Article\. 3 reactions\."/);
  assert.match(html, /3 reactions: 2 like, 1 heart/);
  assert.match(html, /<span class="inline-flex h-7[^>]+role="img"/);
});

test("coverless recommendations show content instead of an empty image slot", () => {
  const html = renderToStaticMarkup(createElement(RelatedPostCard, {
    slug: "without-cover",
    title: "An Article Without a Cover",
    summary: "The summary stays readable without a decorative placeholder.",
  }));
  assert.match(html, /An Article Without a Cover/);
  assert.match(html, /The summary stays readable/);
  assert.doesNotMatch(html, /<img|aspect-video/);
});

test("unsupported cover URLs use the same text-first card instead of breaking image rendering", () => {
  const html = renderToStaticMarkup(createElement(RelatedPostCard, {
    slug: "unsupported-cover",
    title: "A Related Article",
    summary: "The article remains accessible.",
    imageName: "https://untrusted.example/cover.jpg",
  }));
  assert.doesNotMatch(html, /<img|aspect-video/);
  assert.match(html, /href="\/blog\/unsupported-cover"/);
});
