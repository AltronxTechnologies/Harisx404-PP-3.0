import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { evaluate } from "@mdx-js/mdx";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import ts from "typescript";
import { validateBlogMdx } from "../app/lib/blog-mdx-policy.mjs";

test("CodePen iframe rewrite cannot introduce executable MDX", async () => {
  const source = await readFile(new URL("../app/components/mdx.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  });
  const exports = {};
  const mockComponent = new Proxy({ MdxLink: "a", MdxParagraph: "p" }, {
    get: (target, name) => target[name] ?? "span",
  });
  const dependencies = {
    "@mdx-js/mdx": { evaluate },
    "remark-gfm": remarkGfm,
    "react/jsx-runtime": jsxRuntime,
    "react/jsx-dev-runtime": jsxRuntime,
    react: React,
    "./mdx-components": mockComponent,
    "./CodePlayground": mockComponent,
    "./Details": mockComponent,
    "@/app/lib/toc-utils": { addHeadingIds: (tree) => tree },
    "@/app/lib/blog-mdx-policy.mjs": { validateBlogMdx },
  };
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(Object.hasOwn(dependencies, name), `unexpected import: ${name}`);
      return dependencies[name];
    },
    process: { env: { NODE_ENV: "production" } },
    console,
  });

  const normal = await exports.MDXContent({
    code: '<iframe src="https://codepen.io/user/embed/abc123"></iframe>',
  });
  const html = renderToStaticMarkup(normal);
  assert.match(html, /href="https:\/\/codepen.io\/user\/pen\/abc123"/);
  assert.match(html, /Open this interactive example on CodePen/);
  assert.doesNotMatch(html, /<iframe/);

  let executed = false;
  globalThis.__mdxRewriteProbe = () => { executed = true; };
  try {
    const code = '<iframe src="https://codepen.io/user/embed/abc){globalThis.__mdxRewriteProbe()}("></iframe>';
    assert.doesNotThrow(() => validateBlogMdx(code));
    const result = await exports.MDXContent({ code });
    renderToStaticMarkup(result);
    assert.equal(executed, false, "rewritten MDX must not execute the injected expression");
  } finally {
    delete globalThis.__mdxRewriteProbe;
  }
});
