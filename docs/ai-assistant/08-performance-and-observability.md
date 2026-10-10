# Performance, Observability & Operational Safeguards

**Phase:** Phase 7 — Performance, Observability, and Cost Safeguards  
**Status:** Implemented & Verified  
**Date:** October 10, 2026  
**Component:** `app/api/ai/chat/route.ts` & `tests/ai-performance-observability.test.mjs`

---

## 1. Executive Summary

Phase 7 hardens the assistant against cost overruns, serverless timeout kills, and operational blindness. It establishes strict request budgeting, an in-memory knowledge cache, an emergency circuit-breaker switch (`AI_ASSISTANT_DISABLED`), unique request tracing (`X-Request-ID`), and privacy-compliant telemetry that strictly redacts user messages, personal data, and API credentials.

---

## 2. Latency Budgeting & Serverless Protection

### 2.1 The Vercel Serverless Constraint
On standard Vercel serverless configurations, functions have a default 10-second timeout limit. A naive chain of upstream AI providers (e.g. 8s Groq timeout + 8s Gemini timeout = 16s) will cause Vercel to terminate the function with a `504 Gateway Timeout` or `FUNCTION_INVOCATION_TIMEOUT` error.

### 2.2 Enforced Timeouts
- **Primary Groq Streaming Timeout:** `AbortSignal.timeout(4500)` (4.5s deadline).
- **Secondary Gemini Fallback Timeout:** `4500ms` promise race deadline.
- **Combined Ceiling:** Maximum serverless duration is strictly capped at $\le 9.0\text{s}$, guaranteeing the function returns before Vercel's 10s ceiling.
- **Token Output Budgets:**
  - Groq: `max_completion_tokens: 800`
  - Gemini: `maxOutputTokens: 500-600`

---

## 3. Operational Circuit Breaker (`AI_ASSISTANT_DISABLED`)

If upstream providers experience quota exhaustion, severe outages, or unexpected billing spikes, the portfolio owner can pause the assistant immediately without code changes or redeployments.

### 3.1 Mechanism
Setting `AI_ASSISTANT_DISABLED="true"` in the environment variables immediately short-circuits the endpoint:
```ts
if (process.env.AI_ASSISTANT_DISABLED === 'true') {
  logTelemetry({ requestId, status: 503, durationMs: Date.now() - startTime, errorCategory: 'CIRCUIT_BREAKER_DISABLED' });
  return NextResponse.json(
    { error: "The AI assistant is temporarily paused for maintenance. You can explore Haris's work at /projects or reach out at /contact." },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600', 'X-Request-ID': requestId } }
  );
}
```

### 3.2 Invariants Guaranteed
- **Zero Cost:** Zero requests are sent to Groq or Google Gemini.
- **Zero Database Load:** No Supabase queries are executed.
- **Site Integrity:** The portfolio website remains 100% operational, and visitors receive recovery links to `/projects` and `/contact`.

---

## 4. Privacy-Compliant Observability & Request Tracing

### 4.1 Unique Request IDs
Every incoming chat request generates an opaque, collision-resistant identifier:
```ts
const requestId = `req_${startTime.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
```
This ID is returned in response headers as `X-Request-ID` and embedded in the SSE `start` and `done` events.

### 4.2 Telemetry Schema
When telemetry is enabled (`ENABLE_AI_TELEMETRY="true"`), the route logs structured operational JSON:
```json
{
  "type": "ai_chat_telemetry",
  "timestamp": "2026-10-10T17:59:43.000Z",
  "requestId": "req_m1abcde_12345",
  "provider": "groq",
  "status": 200,
  "durationMs": 4910,
  "tokensEmitted": 48
}
```

### 4.3 Zero-Data Privacy Guarantee
- **No User Text:** Visitor messages and assistant responses are **never** logged.
- **No Personal Identifiers:** Raw visitor IP addresses are **never** included in telemetry logs.
- **No Secrets:** Upstream API keys (`GROQ_API_KEY`, `GOOGLE_AI_API_KEY`) and headers are excluded.
- **Compliance:** Full alignment with privacy guidelines and zero retention of chat conversation bodies on the server.

---

## 5. Verification Evidence

- **All 6 Test Suites Passing (29/29 Tests):**
  ```bash
  node --test tests/ai-performance-observability.test.mjs tests/ai-responsive-ux.test.mjs tests/ai-streaming-protocol.test.mjs tests/ai-security-hardening.test.mjs tests/chat-provider-fallback.test.mjs tests/public-auth-ai-boundaries.test.mjs
  ```
  - `ok 1`: Circuit breaker returns 503 with zero provider queries.
  - `ok 2`: Responses include `X-Request-ID` and duration tracking.
  - `ok 3`: Telemetry logs strictly omit secret prompts and credentials.
  - `ok 4`: Provider token budgets and bounded timeouts verified in source.
  - `ok 5-29`: All responsive, streaming, security, boundary, and fallback tests passing.
- **TypeScript:** `npx tsc --noEmit` $\to$ **0 errors**.
- **Linting:** `npm run lint` $\to$ **0 errors or warnings**.
