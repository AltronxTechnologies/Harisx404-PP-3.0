import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/api/ai/chat/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function createStreamingRoute({
  groqKey = "test-groq-key",
  geminiKey = "test-gemini-key",
  groqHandler,
  geminiHandler,
} = {}) {
  const calls = { groq: 0, gemini: 0 };
  const exports = {};

  runInNewContext(compiled, {
    exports,
    process: { env: { GROQ_API_KEY: groqKey, GOOGLE_AI_API_KEY: geminiKey } },
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === "@/app/lib/gemini") {
        return {
          geminiFlash: {
            startChat: () => ({
              sendMessageStream: async (msg) => {
                calls.gemini++;
                if (typeof geminiHandler === "function") return geminiHandler(msg);
                return {
                  stream: (async function* () {
                    yield { text: () => "Gemini " };
                    yield { text: () => "streamed " };
                    yield { text: () => "answer" };
                  })(),
                };
              },
              sendMessage: async () => {
                calls.gemini++;
                return { response: { text: () => "Gemini static answer" } };
              },
            }),
          },
        };
      }
      if (name === "@/app/lib/supabase/safe") return { getPublicSupabase: () => null };
      if (name === "@/app/lib/utils") return { fetchProjects: async () => [], fetchAndSortBlogPosts: async () => [] };
      if (name === "@/app/lib/rate-limit") return { checkRateLimit: () => ({ success: true }) };
      if (name === "util") return { TextEncoder };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    fetch: async (url, options) => {
      calls.groq++;
      if (typeof groqHandler === "function") return groqHandler(url, options);
      // Default: Simulate valid Groq SSE stream
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"Groq "}}]}\n\n'));
          controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"streamed "}}]}\n\n'));
          controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"response"}}]}\n\n'));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    },
    URL, Response, ReadableStream, TextEncoder, TextDecoder, AbortSignal, AbortController, setTimeout, clearTimeout,
    console: { error() {} },
  });

  return { calls, POST: exports.POST };
}

async function collectSSEEvents(response) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  assert.equal(response.headers.get("cache-control"), "no-cache, no-transform");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const rawEvents = buffer.split(/\n\n/);
    buffer = rawEvents.pop() || "";
    for (const raw of rawEvents) {
      if (!raw.trim()) continue;
      let event = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      events.push({ event, data: JSON.parse(data) });
    }
  }

  return events;
}

test("Groq streaming delivers start, deltas, and done without calling Gemini", async () => {
  const { calls, POST } = createStreamingRoute();
  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
      stream: true,
    }),
  });

  const response = await POST(req);
  const events = await collectSSEEvents(response);

  assert.equal(calls.groq, 1);
  assert.equal(calls.gemini, 0);

  assert.equal(events[0].event, "start");
  assert.equal(events[0].data.provider, "groq");

  const deltas = events.filter((e) => e.event === "delta").map((e) => e.data.text);
  assert.equal(deltas.join(""), "Groq streamed response");

  assert.equal(events.at(-1).event, "done");
  assert.equal(events.at(-1).data.totalLength, "Groq streamed response".length);
});

test("Groq HTTP failure before first token falls back to Gemini streaming", async () => {
  const { calls, POST } = createStreamingRoute({
    groqHandler: async () => new Response("Rate limit exceeded", { status: 429 }),
  });

  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
      stream: true,
    }),
  });

  const response = await POST(req);
  const events = await collectSSEEvents(response);

  assert.equal(calls.groq, 1);
  assert.equal(calls.gemini, 1);

  assert.equal(events[0].event, "start");
  assert.equal(events[0].data.provider, "gemini");

  const deltas = events.filter((e) => e.event === "delta").map((e) => e.data.text);
  assert.equal(deltas.join(""), "Gemini streamed answer");

  assert.equal(events.at(-1).event, "done");
});

test("Groq failure AFTER emitting tokens emits STREAM_INTERRUPTED and does NOT mix Gemini output", async () => {
  let pullCount = 0;
  const { calls, POST } = createStreamingRoute({
    groqHandler: async () => {
      const stream = new ReadableStream({
        pull(controller) {
          const enc = new TextEncoder();
          if (pullCount === 0) {
            pullCount++;
            controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"Partial Groq token"}}]}\n\n'));
          } else {
            controller.error(new Error("Groq upstream network drop"));
          }
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
    },
  });

  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
      stream: true,
    }),
  });

  const response = await POST(req);
  const events = await collectSSEEvents(response);

  assert.equal(calls.groq, 1);
  // Gemini must NOT be called to avoid mixing two different model responses together!
  assert.equal(calls.gemini, 0);

  const errorEvent = events.find((e) => e.event === "error");
  assert.ok(errorEvent, "Must emit an error event when stream is interrupted");
  assert.equal(errorEvent.data.code, "STREAM_INTERRUPTED");
});

test("Both providers failing emits UNAVAILABLE error without unhandled exception", async () => {
  const { calls, POST } = createStreamingRoute({
    groqHandler: async () => new Response("Service unavailable", { status: 503 }),
    geminiHandler: async () => { throw new Error("Gemini quota exhausted"); },
  });

  const req = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tell me about Haris" }],
      stream: true,
    }),
  });

  const response = await POST(req);
  const events = await collectSSEEvents(response);

  assert.equal(calls.groq, 1);
  assert.equal(calls.gemini, 1);

  const errorEvent = events.find((e) => e.event === "error");
  assert.ok(errorEvent);
  assert.equal(errorEvent.data.code, "UNAVAILABLE");
});

test("Network chunk fragmentation and UTF-8 boundaries are reassembled correctly by client parser", async () => {
  // Simulate stream fragmented into tiny arbitrary byte chunks (e.g. 2 bytes per chunk)
  const fullSSE = 'event: start\ndata: {"provider":"groq"}\n\n' +
    'event: delta\ndata: {"text":"⚡ Haris is a Full-Stack Engineer "}\n\n' +
    'event: delta\ndata: {"text":"with deep cybersecurity skills! 🛡️"}\n\n' +
    'event: done\ndata: {"totalLength":64}\n\n';

  const rawBytes = new TextEncoder().encode(fullSSE);
  const fragmentedStream = new ReadableStream({
    start(controller) {
      let offset = 0;
      const chunkSize = 3; // tiny 3-byte fragments splitting multi-byte characters and lines
      while (offset < rawBytes.length) {
        controller.enqueue(rawBytes.subarray(offset, offset + chunkSize));
        offset += chunkSize;
      }
      controller.close();
    },
  });

  const response = new Response(fragmentedStream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
  });

  const events = await collectSSEEvents(response);
  assert.equal(events.length, 4);
  assert.equal(events[0].event, "start");
  assert.equal(events[0].data.provider, "groq");

  const combinedText = events
    .filter((e) => e.event === "delta")
    .map((e) => e.data.text)
    .join("");
  assert.equal(combinedText, "⚡ Haris is a Full-Stack Engineer with deep cybersecurity skills! 🛡️");
  assert.equal(events[3].event, "done");
});
