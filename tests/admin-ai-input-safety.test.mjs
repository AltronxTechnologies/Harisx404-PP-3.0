import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function route(path, { fetchImpl, generateText }) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === "@/app/lib/supabase/server") return { default: async () => ({ auth: { getUser: async () => ({ data: { user: { email: "owner@test.local" } }, error: null }) } }) };
      if (name === "@/app/lib/gemini") return { generateText };
      return require(name);
    },
    process: { env: { ADMIN_EMAIL: "owner@test.local" } },
    fetch: fetchImpl,
    URL,
    Response,
    TextDecoder,
    AbortSignal,
    encodeURIComponent,
    console: { error() {} },
  });
  return exports.POST;
}

function post(body) {
  return new Request("http://localhost/api/ai/test", { method: "POST", body: JSON.stringify(body) });
}

test("GitHub generation rejects spoofed hosts and oversized README data before calling AI", async () => {
  let fetches = 0;
  let generations = 0;
  const handler = route("app/api/ai/project-from-github/route.ts", {
    fetchImpl: async () => { fetches++; return new Response(new Uint8Array(65537).fill(65)); },
    generateText: async () => { generations++; return "{}"; },
  });
  for (const github_url of ["https://github.com.evil.test/owner/repo", "http://github.com/owner/repo", "https://github.com@evil.test/owner/repo", "not a URL"]) {
    assert.equal((await handler(post({ github_url }))).status, 400);
  }
  assert.equal(fetches, 0);
  assert.equal((await handler(post({ github_url: "https://github.com/owner/repo" }))).status, 413);
  assert.equal(fetches, 1);
  assert.equal(generations, 0);
});

test("GitHub generation validates the model response and does not expose provider failures", async () => {
  const handler = route("app/api/ai/project-from-github/route.ts", {
    fetchImpl: async () => new Response("A".repeat(80)),
    generateText: async () => JSON.stringify({ summary: "Summary", description: "Description", tags: ["typescript"] }),
  });
  const response = await handler(post({ github_url: "https://github.com/owner/repo" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.summary, "Summary");

  const failure = route("app/api/ai/project-from-github/route.ts", {
    fetchImpl: async () => { throw new Error("private upstream response"); },
    generateText: async () => "{}",
  });
  const error = await failure(post({ github_url: "https://github.com/owner/repo" }));
  assert.equal(error.status, 503);
  assert.doesNotMatch(JSON.stringify(await error.json()), /private upstream response/);
});

test("AI assist bounds content and hides provider errors", async () => {
  let calls = 0;
  const handler = route("app/api/ai/assist/route.ts", {
    generateText: async () => { calls++; throw new Error("private provider response"); },
  });
  assert.equal((await handler(post({ action: "summary", content: "a".repeat(50001) }))).status, 400);
  assert.equal(calls, 0);
  const error = await handler(post({ action: "summary", content: "text" }));
  assert.equal(error.status, 503);
  assert.doesNotMatch(JSON.stringify(await error.json()), /private provider response/);
});

test("Blog editor shows the bounded AI API's actionable failure message", () => {
  const editor = readFileSync(new URL("../app/components/admin/TiptapEditor.tsx", import.meta.url), "utf8");
  assert.match(editor, /await readAdminResponse\(res, "AI assistance"\)/);
  assert.match(editor, /throw new Error\(failed\.error \|\| "AI request failed"\)/);
});
