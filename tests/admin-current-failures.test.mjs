import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("Search rejects a partial query failure instead of returning incomplete results", async () => {
  const source = readFileSync(new URL("../app/api/ai/search/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let next = 0;
  let failingIndex = -1;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === "@/app/lib/rate-limit") return { checkRateLimit: () => ({ success: true }) };
      if (name === "@/app/blog/data") return { isLocalBlogDraft: () => false };
      if (name === "@/app/lib/supabase/safe") return { getPublicSupabase: () => ({ from() { return {
        select() { return this; }, eq() { return this; }, lte() { return this; }, ilike() { return this; },
        limit() { const index = next++; return { then(resolve) { resolve(index === failingIndex
          ? { data: null, error: { message: "private error" } }
          : { data: index === 3 ? [{ title: "Example", slug: "example", description: "Match" }] : [], error: null }); } }; },
      }; } }) };
      return require(name);
    },
    TextEncoder, Map, Promise, Response, console: { error() {} },
  });
  const request = () => new Request("http://localhost/api/ai/search", { method: "POST", body: JSON.stringify({ query: "exam" }) });
  let response = await exports.POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).results.length, 1);
  next = 0;
  failingIndex = 1;
  response = await exports.POST(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private error/);
});

test("Dashboard reports unavailable counts honestly and Blog actions parse gateway errors safely", () => {
  const dashboard = readFileSync(new URL("../app/admin/(dashboard)/page.tsx", import.meta.url), "utf8");
  const archive = readFileSync(new URL("../app/admin/(dashboard)/blogs/BlogArchiveAction.tsx", import.meta.url), "utf8");
  for (const count of ["blogCount", "publishedBlogCount", "draftBlogCount", "projectCount"]) {
    assert.match(dashboard, new RegExp(`${count} === null \\? "—"`));
  }
  assert.match(dashboard, /blogCount === null \|\| publishedBlogCountError/);
  assert.equal((archive.match(/await readAdminResponse\(response, "Blog (archive|deletion)"\)/g) || []).length, 2);
  assert.match(archive, /result\.deleted !== true/);
});
