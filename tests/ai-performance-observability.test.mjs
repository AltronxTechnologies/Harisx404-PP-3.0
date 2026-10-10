import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/api/ai/chat/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function createRoute({ disabled = "false", telemetry = "true", groqKey = "test-groq", geminiKey = "test-gemini" } = {}) {
  const calls = { groq: 0, gemini: 0 };
  const logs = [];
  const exports = {};

  runInNewContext(compiled, {
    exports,
    process: {
      env: {
        AI_ASSISTANT_DISABLED: disabled,
        ENABLE_AI_TELEMETRY: telemetry,
        GROQ_API_KEY: groqKey,
        GOOGLE_AI_API_KEY: geminiKey,
      },
    },
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === "@/app/lib/gemini") return { geminiFlash: { startChat: () => ({ sendMessage: async () => {
        calls.gemini++;
        return { response: { text: () => "Gemini answer" } };
      } }) } };
      if (name === "@/app/lib/supabase/safe") return { getPublicSupabase: () => null };
      if (name === "@/app/lib/utils") return { fetchProjects: async () => [], fetchAndSortBlogPosts: async () => [] };
      if (name === "@/app/lib/rate-limit") return { checkRateLimit: () => ({ success: true }) };
      if (name === "util") return { TextEncoder };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    fetch: async () => {
      calls.groq++;
      return Response.json({ choices: [{ message: { content: "Groq answer" } }] });
    },
    URL, Response, ReadableStream, TextEncoder, TextDecoder, AbortSignal, setTimeout, clearTimeout,
    console: {
      log(msg) { logs.push(msg); },
      error() {},
    },
  });

  return { calls, logs, POST: exports.POST };
}

test("Circuit breaker safely pauses AI without querying providers or database", async () => {
  const { calls, logs, POST } = createRoute({ disabled: "true" });
  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
    }),
  });

  const response = await POST(req);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "3600");
  assert.ok(response.headers.get("x-request-id"));

  const data = await response.json();
  assert.match(data.error, /temporarily paused/i);
  assert.match(data.error, /\/projects/);
  assert.match(data.error, /\/contact/);

  // Critical: zero upstream provider calls made
  assert.equal(calls.groq, 0);
  assert.equal(calls.gemini, 0);

  // Telemetry logged with error category
  const telemetry = logs.map((l) => JSON.parse(l));
  assert.equal(telemetry[0].errorCategory, "CIRCUIT_BREAKER_DISABLED");
});

test("Responses include X-Request-ID and duration tracking", async () => {
  const { calls, POST } = createRoute({ disabled: "false" });
  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
    }),
  });

  const response = await POST(req);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("x-request-id"));
  assert.match(response.headers.get("x-request-id"), /^req_/);
  assert.equal(calls.groq, 1);
});

test("Telemetry logs never record user message contents or secret credentials", () => {
  const { logs, POST } = createRoute({ disabled: "false", telemetry: "true" });
  const secretPrompt = "SUPER_SECRET_USER_INPUT_KEYWORD_XYZ";

  POST(new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: secretPrompt }],
    }),
  })).then(() => {
    const rawLogs = logs.join("\n");
    assert.doesNotMatch(rawLogs, new RegExp(secretPrompt), "User prompt must never appear in telemetry logs");
    assert.doesNotMatch(rawLogs, /test-groq|test-gemini/, "API keys must never appear in telemetry logs");
  });
});

test("Provider token budget constraints are strictly bounded in source", () => {
  assert.match(source, /max_completion_tokens: 800/);
  assert.match(source, /maxOutputTokens: (?:500|600)/);
  assert.match(source, /AbortSignal\.timeout\(4500\)/);
});
