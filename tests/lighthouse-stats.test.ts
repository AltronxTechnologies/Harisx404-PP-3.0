import assert from "node:assert/strict";
import test from "node:test";
import { loadLighthouseStats } from "../app/lib/stats/lighthouse-stats";

const site = "https://harisx404.vercel.app";
const scores = { performance: { score: 0.93 }, accessibility: { score: 0.95 }, "best-practices": { score: 1 }, seo: { score: 0.89 } };
const report = (categories = scores) => new Response(JSON.stringify({ lighthouseResult: { categories, fetchTime: "2026-10-04T12:00:00.000Z" } }), { status: 200 });

async function withFetch(mock: typeof fetch, run: () => Promise<void>, preview = false) {
  const originalFetch = globalThis.fetch;
  const originalAlloy = process.env.IS_ALLOY;
  const originalKey = process.env.PAGESPEED_API_KEY;
  const originalWarn = console.warn;
  globalThis.fetch = mock;
  process.env.IS_ALLOY = String(preview);
  delete process.env.PAGESPEED_API_KEY;
  console.warn = () => {};
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalAlloy === undefined) delete process.env.IS_ALLOY;
    else process.env.IS_ALLOY = originalAlloy;
    if (originalKey === undefined) delete process.env.PAGESPEED_API_KEY;
    else process.env.PAGESPEED_API_KEY = originalKey;
  }
}

test("Alloy preview does not call the production PageSpeed API", async () => {
  await withFetch(async () => { throw new Error("Network must not be used"); }, async () => {
    assert.deepEqual(await loadLighthouseStats(), { mobile: null, desktop: null, partialFailure: false });
  }, true);
});

test("production requests both device reports for the confirmed origin", async () => {
  const calls: URL[] = [];
  await withFetch(async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    return url.origin === new URL(site).origin ? new Response(null, { status: 200 }) : report();
  }, async () => {
    const result = await loadLighthouseStats();
    assert.equal(result.partialFailure, false);
    assert.deepEqual(result.mobile, { performance: 93, accessibility: 95, bestPractices: 100, seo: 89, fetchedAt: "2026-10-04T12:00:00.000Z" });
    assert.deepEqual(result.desktop, result.mobile);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].toString(), `${site}/`);
    assert.deepEqual(calls.slice(1).map((url) => url.searchParams.get("strategy")).sort(), ["desktop", "mobile"]);
    for (const url of calls.slice(1)) {
      assert.equal(url.searchParams.get("url"), site);
      assert.deepEqual(url.searchParams.getAll("category"), ["performance", "accessibility", "best-practices", "seo"]);
    }
  });
});

test("unreachable production site suppresses PageSpeed checks", async () => {
  let calls = 0;
  await withFetch(async () => { calls++; return new Response(null, { status: 404 }); }, async () => {
    assert.deepEqual(await loadLighthouseStats(), { mobile: null, desktop: null, partialFailure: true });
    assert.equal(calls, 1);
  });
});

test("production redirects to another origin are not scored", async () => {
  let calls = 0;
  await withFetch(async () => {
    calls++;
    const response = new Response(null, { status: 200 });
    Object.defineProperty(response, "url", { value: "https://vercel.com/login" });
    return response;
  }, async () => {
    assert.deepEqual(await loadLighthouseStats(), { mobile: null, desktop: null, partialFailure: true });
    assert.equal(calls, 1);
  });
});

test("a failing device preserves the other report", async () => {
  await withFetch(async (input) => {
    const url = new URL(String(input));
    if (url.origin === new URL(site).origin) return new Response(null, { status: 200 });
    if (url.searchParams.get("strategy") === "desktop") return new Response(null, { status: 429 });
    return report();
  }, async () => {
    const result = await loadLighthouseStats();
    assert.equal(result.partialFailure, true);
    assert.equal(result.mobile?.performance, 93);
    assert.equal(result.desktop, null);
  });
});

test("invalid score payloads cannot render fabricated values", async () => {
  await withFetch(async (input) => {
    const url = new URL(String(input));
    if (url.origin === new URL(site).origin) return new Response(null, { status: 200 });
    return url.searchParams.get("strategy") === "mobile" ? report({ ...scores, performance: { score: 1.2 } }) : report();
  }, async () => {
    const result = await loadLighthouseStats();
    assert.equal(result.partialFailure, true);
    assert.equal(result.mobile, null);
    assert.equal(result.desktop?.seo, 89);
  });
});

test("production preflight timeouts fail closed", async () => {
  await withFetch(async () => { throw new DOMException("Timed out", "AbortError"); }, async () => {
    assert.deepEqual(await loadLighthouseStats(), { mobile: null, desktop: null, partialFailure: true });
  });
});
