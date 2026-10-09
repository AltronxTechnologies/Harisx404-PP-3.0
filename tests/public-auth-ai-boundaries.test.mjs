import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, mocks) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) { return mocks[name] ?? require(name); },
    URL, Response, TextDecoder, console: { error() {} },
  });
  return exports;
}

test("OAuth callback keeps successful redirects on-site and preserves safe paths", async () => {
  const { GET } = load("app/auth/callback/route.ts", {
    "next/headers": { cookies: async () => ({ get() {}, set() {}, delete() {} }) },
    "next/server": { NextResponse: { redirect: (url) => ({ location: String(url) }) } },
    "@supabase/ssr": { createServerClient: () => ({ auth: { exchangeCodeForSession: async () => ({ error: null }) } }) },
    "@/app/lib/supabase/safe": { getSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "public" }) },
  });
  for (const next of ["@evil.test", "//evil.test", "/\\evil.test", "https://evil.test/", "%2F%2Fevil.test", "\\evil.test"]) {
    const request = new Request(`https://site.test/auth/callback?code=test&next=${encodeURIComponent(next)}`);
    const response = await GET(request);
    assert.equal(new URL(response.location).origin, "https://site.test", next);
    assert.equal(new URL(response.location).pathname, "/community-wall", next);
  }
  const safe = await GET(new Request("https://site.test/auth/callback?code=test&next=%2Fprojects%3Ftag%3Dweb"));
  assert.equal(safe.location, "https://site.test/projects?tag=web");
  const defaultRoute = await GET(new Request("https://site.test/auth/callback?code=test"));
  assert.equal(defaultRoute.location, "https://site.test/community-wall");
  const failedExchange = load("app/auth/callback/route.ts", {
    "next/headers": { cookies: async () => ({ get() {}, set() {}, delete() {} }) },
    "next/server": { NextResponse: { redirect: (url) => ({ location: String(url) }) } },
    "@supabase/ssr": { createServerClient: () => ({ auth: { exchangeCodeForSession: async () => ({ error: new Error("expired") }) } }) },
    "@/app/lib/supabase/safe": { getSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "public" }) },
  });
  assert.equal((await failedExchange.GET(new Request("https://site.test/auth/callback?code=test&next=%2Fprojects"))).location,
    "https://site.test/community-wall?auth=error");
});

test("chat rejects oversized, malformed and invalid histories before any provider or data work", async () => {
  let calls = 0;
  const { POST } = load("app/api/ai/chat/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/app/lib/gemini": { geminiFlash: { startChat: () => { calls++; return { sendMessage: async () => ({ response: { text: () => "Answer" } }) }; } } },
    "@/app/lib/supabase/safe": { getPublicSupabase: () => { calls++; return null; } },
    "@/app/lib/utils": { fetchProjects: async () => { calls++; return []; }, fetchAndSortBlogPosts: async () => { calls++; return []; } },
    "@/app/lib/rate-limit": { checkRateLimit: () => ({ success: true }) },
  });
  const send = (body) => POST(new Request("https://site.test/api/ai/chat", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
  const user = { role: "user", content: "What projects are published?" };
  for (const body of [
    { messages: Array(100).fill(user) },
    { messages: [{ role: "user", content: "x".repeat(3000) }] },
    { messages: [{ role: "admin", content: "hello" }, user] },
    { messages: [{ role: "user", content: {} }] },
    { messages: [{ role: "model", content: "Only a model turn" }] },
    { messages: [] },
  ]) assert.equal((await send(body)).status, 400);
  assert.equal((await send("x".repeat(40000))).status, 413);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("x".repeat(40000))); controller.close(); } });
  const chunked = new Request("https://site.test/api/ai/chat", { method: "POST", body: stream, duplex: "half" });
  assert.equal((await POST(chunked)).status, 413);
  assert.equal((await send("{" )).status, 400);
  assert.equal(calls, 0);

  const valid = await send({ messages: [{ role: "model", content: "Hello" }, user] });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).text, "Answer");
  assert.ok(calls > 0);
});

test("shared chat widget bounds requests and exposes named, reachable controls", () => {
  const source = readFileSync(new URL("../app/components/ChatbotWidget.tsx", import.meta.url), "utf8");
  assert.match(source, /newMessages\.slice\(-20\)/);
  assert.match(source, /maxLength=\{2000\}/);
  assert.match(source, /aria-label="Close chat"/);
  assert.match(source, /aria-label="Send chat message"/);
  assert.match(source, /toggleRef\.current\?\.focus\(\)/);
  assert.match(source, /w-\[min\(20rem,calc\(100vw-3rem\)\)\]/);
});

test("server HTML uses the current chat widget markup before hydration", async () => {
  const response = await fetch(process.env.PREVIEW_BASE_URL || "http://localhost:3000/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /fixed bottom-6 right-6 z-\[5500\] flex flex-col items-end/);
  assert.match(html, /aria-label="Toggle chat" aria-expanded="false" aria-controls="portfolio-chat-panel"/);
  assert.doesNotMatch(html, /fixed bottom-6 right-6 z-\[4000\] flex flex-col items-end/);
});
