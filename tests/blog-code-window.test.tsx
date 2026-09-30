import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogCodeWindow, BlogInlineCode } from "../app/components/blog/BlogCode";

test("Blog code windows have valid markup, no filename strip and a visible copy action", () => {
  const html = renderToStaticMarkup(createElement(BlogCodeWindow, null,
    createElement("code", { className: "language-jsx:example.tsx" }, 'const markup = "<script>alert(1)</script>";\n')));
  assert.doesNotMatch(html, /example\.tsx/);
  assert.match(html, /aria-label="Code snippet in jsx"/);
  assert.match(html, /aria-label="Copy code"/);
  assert.match(html, /<pre[^>]*><code/);
  assert.doesNotMatch(html, /<pre[^>]*><div/);
  assert.doesNotMatch(html, /<script\b/);
  assert.match(html, /&lt;script/);
});

test("Inline code remains a semantic code element", () => {
  const html = renderToStaticMarkup(createElement(BlogInlineCode, null, "a < b"));
  assert.match(html, /^<code[^>]*>a &lt; b<\/code>$/);
});
