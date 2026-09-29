import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import * as runtime from "react/jsx-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("new Blog table syntax renders accessible table cells instead of pipe text", async () => {
  const { default: Content } = await evaluate(
    "| Topic | Detail |\n| --- | --- |\n| One | Two |",
    { ...runtime, remarkPlugins: [remarkGfm] },
  );
  const html = renderToStaticMarkup(createElement(Content));
  assert.match(html, /<table>/);
  assert.match(html, /<th>Topic<\/th>/);
  assert.match(html, /<td>Two<\/td>/);
  const renderer = await readFile(new URL("../app/components/mdx.tsx", import.meta.url), "utf8");
  assert.match(renderer, /remarkPlugins: \[remarkGfm, \(\) => addHeadingIds\]/);
});
