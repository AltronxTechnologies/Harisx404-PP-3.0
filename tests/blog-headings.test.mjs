import assert from "node:assert/strict";
import test from "node:test";
import { createProcessor } from "@mdx-js/mdx";
import { evaluate } from "@mdx-js/mdx";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import { addHeadingIds, extractHeadingsFromMdx } from "../app/lib/toc-utils.ts";

test("TOC entries and rendered IDs agree for formatted, duplicate, and fenced headings", () => {
  const source = [
    "# Repeated title",
    "## **What are the methods?**",
    "## **What are the methods?**",
    "### An `inline` example",
    "```md",
    "## Not a heading",
    "```",
    "## Repeated title",
  ].join("\n");
  const headings = extractHeadingsFromMdx(source);
  assert.deepEqual(headings, [
    { level: 2, text: "Repeated title", slug: "repeated-title", number: "1" },
    { level: 2, text: "What are the methods?", slug: "what-are-the-methods", number: "2" },
    { level: 2, text: "What are the methods?", slug: "what-are-the-methods-2", number: "3" },
    { level: 3, text: "An inline example", slug: "an-inline-example", number: "3.1" },
    { level: 2, text: "Repeated title", slug: "repeated-title-2", number: "4" },
  ]);

  const tree = createProcessor().parse(source);
  addHeadingIds(tree);
  assert.equal(tree.children.filter((node) => node.type === "heading" && node.depth === 1).length, 0);
  const ids = tree.children
    .filter((node) => node.type === "heading")
    .map((node) => node.data?.hProperties?.id);
  assert.deepEqual(ids, [
    "repeated-title",
    "what-are-the-methods",
    "what-are-the-methods-2",
    "an-inline-example",
    "repeated-title-2",
  ]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(tree.children.filter((node) => node.type === "heading").map((node) => node.data?.hProperties?.["data-section-number"]), ["1", "2", "3", "3.1", "4"]);
});

test("authored numbering is not duplicated and nesting resets per section", () => {
  const source = "## First\n### Detail\n### 1. Authored step\n## Second\n### Further detail\n### 1.1 Authored substep";
  assert.deepEqual(extractHeadingsFromMdx(source).map(({ number }) => number), ["1", "1.1", "", "2", "2.1", ""]);
});

test("body H1 is rendered as H2 so the article title remains the only H1", async () => {
  const { default: Content } = await evaluate("# Introduction", {
    ...jsxRuntime,
    remarkPlugins: [() => addHeadingIds],
  });
  const html = renderToStaticMarkup(createElement(Content));
  assert.match(html, /<h2 id="introduction" data-section-number="1">Introduction<\/h2>/);
});
