import assert from "node:assert/strict";
import test from "node:test";
import { createProcessor } from "@mdx-js/mdx";
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
    { level: 2, text: "What are the methods?", slug: "what-are-the-methods" },
    { level: 2, text: "What are the methods?", slug: "what-are-the-methods-2" },
    { level: 3, text: "An inline example", slug: "an-inline-example" },
    { level: 2, text: "Repeated title", slug: "repeated-title-2" },
  ]);

  const tree = createProcessor().parse(source);
  addHeadingIds(tree);
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
});
