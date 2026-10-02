import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("related-post query failures do not prevent the article from rendering", async () => {
  const source = await readFile(new URL("../app/lib/utils.ts", import.meta.url), "utf8");
  const file = ts.createSourceFile("utils.ts", source, ts.ScriptTarget.Latest, true);
  const declaration = file.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "getRelatedBlogPosts");
  assert.ok(declaration);
  const { outputText } = ts.transpileModule(declaration.getText(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });

  let outcome;
  const query = {
    select() { return this; },
    in() { return this; },
    eq() { return this; },
    lte() { return outcome; },
  };
  const exports = {};
  const warnings = [];
  runInNewContext(outputText, {
    exports,
    supabase: { from: () => query },
    console: { warn: (message) => warnings.push(message) },
  });
  const post = { slug: "current", relatedBlogPostIds: ["related"] };

  outcome = Promise.reject(new Error("Network unavailable"));
  assert.equal((await exports.getRelatedBlogPosts(post)).length, 0);
  outcome = Promise.resolve({ data: null, error: { message: "Query unavailable" } });
  assert.equal((await exports.getRelatedBlogPosts(post)).length, 0);
  assert.equal(warnings.length, 2);

  outcome = Promise.resolve({ data: [{ id: "related", slug: "another", title: "Another", summary: "Summary", cover_image_url: null }], error: null });
  const [related] = await exports.getRelatedBlogPosts(post);
  assert.equal(related.slug, "another");
  assert.equal(related.imageName, "");
});
