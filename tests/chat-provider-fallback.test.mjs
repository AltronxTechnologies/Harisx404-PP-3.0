import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/api/ai/chat/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function route({ groqKey = "test-only", geminiKey = "test-only", groq, gemini }) {
  const calls = { groq: 0, gemini: 0 };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    process: { env: { GROQ_API_KEY: groqKey, GOOGLE_AI_API_KEY: geminiKey } },
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === "@/app/lib/gemini") return { geminiFlash: { startChat: () => ({ sendMessage: async () => {
        calls.gemini++;
        if (gemini instanceof Error) throw gemini;
        return { response: { text: () => gemini ?? "Gemini answer" } };
      } }) } };
      if (name === "@/app/lib/supabase/safe") return { getPublicSupabase: () => null };
      if (name === "@/app/lib/utils") return { fetchProjects: async () => [], fetchAndSortBlogPosts: async () => [] };
      if (name === "@/app/lib/rate-limit") return { checkRateLimit: () => ({ success: true }) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    fetch: async (url, options) => {
      calls.groq++;
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer test-only");
      const request = JSON.parse(options.body);
      assert.equal(request.model, "openai/gpt-oss-20b");
      assert.equal(request.messages[0].role, "system");
      assert.equal(request.messages.at(-1).content, "Tell me about this site");
      if (groq instanceof Error) throw groq;
      return groq ?? Response.json({ choices: [{ message: { content: "Groq answer" } }] });
    },
    URL, Response, TextDecoder, AbortSignal, setTimeout, clearTimeout,
    console: { error() {} },
  });
  return { calls, POST: exports.POST };
}

async function send(POST) {
  return POST(new Request("http://localhost/api/ai/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Tell me about this site" }] }),
  }));
}

test("Groq answers first without billing Gemini or exposing provider details", async () => {
  const { calls, POST } = route({});
  const result = await send(POST);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { text: "Groq answer" });
  assert.deepEqual(calls, { groq: 1, gemini: 0 });
  assert.equal(result.headers.get("cache-control"), "no-store");
});

test("Gemini silently handles Groq HTTP, network, malformed and empty replies", async () => {
  for (const groq of [
    new Response("rate limited", { status: 429 }),
    new Error("network unavailable"),
    new Response("not JSON"),
    Response.json({ choices: [{ message: { content: "  " } }] }),
  ]) {
    const { calls, POST } = route({ groq });
    const result = await send(POST);
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { text: "Gemini answer" });
    assert.deepEqual(calls, { groq: 1, gemini: 1 });
  }
});

test("missing Groq key uses Gemini; neither provider available fails honestly", async () => {
  const withFallback = route({ groqKey: "" });
  assert.deepEqual(await (await send(withFallback.POST)).json(), { text: "Gemini answer" });
  assert.deepEqual(withFallback.calls, { groq: 0, gemini: 1 });

  const noKeys = route({ groqKey: "", geminiKey: "" });
  const noKeysResponse = await send(noKeys.POST);
  assert.equal(noKeysResponse.status, 503);
  assert.deepEqual(noKeys.calls, { groq: 0, gemini: 0 });
});

test("both providers failing never reports a fabricated success", async () => {
  const { calls, POST } = route({ groq: new Response("private upstream", { status: 401 }), gemini: new Error("private provider response") });
  const result = await send(POST);
  assert.equal(result.status, 503);
  assert.deepEqual(calls, { groq: 1, gemini: 1 });
  assert.doesNotMatch(JSON.stringify(await result.json()), /private upstream|private provider/);
});

test("an explicit safety refusal does not trigger a second provider", async () => {
  const { calls, POST } = route({ groq: Response.json({ choices: [{ finish_reason: "content_filter", message: { content: null } }] }) });
  const result = await send(POST);
  assert.equal(result.status, 200);
  assert.deepEqual(calls, { groq: 1, gemini: 0 });
  assert.match((await result.json()).text, /can't help/);
});
