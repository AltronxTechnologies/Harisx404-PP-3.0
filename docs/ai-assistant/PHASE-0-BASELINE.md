# Phase 0 Baseline Report: AI Assistant Environment & Defect Verification

**Date:** 2026-10-10  
**Repository:** `harisx404-portfolio` (`d:\IT\Harisx404-PP-3.0`)  
**Phase:** Phase 0 — Revalidate the audit and establish a safe baseline  
**Document Status:** Complete — Awaiting Owner Approval for Phase 1  

---

## 1. Executive Summary

Phase 0 has completed all non-destructive baseline checks, re-validated the audit's claims against the live code and runtime environment, reproduced the current chatbot's real latency/fallback defect under safe conditions, and established an evidence-backed baseline table.

**Zero application code was modified, zero persistent database changes were made, and zero git commits/pushes were executed.**

---

## 2. Command Baseline & Execution Results

| Test / Check | Command | Exit Code | Observed Output / Evidence | Status |
|---|---|---|---|---|
| **TypeScript Compilation** | `npx tsc --noEmit` | `0` | Clean run; 0 syntax or type errors. | **PASS** |
| **ESLint Quality Check** | `npm run lint` | `0` | `✔ No ESLint warnings or errors` | **PASS** |
| **Chat Fallback Unit Suite** | `node --test tests/chat-provider-fallback.test.mjs` | `0` | 5/5 tests passed (primary, fallbacks, safety refusal). | **PASS** |
| **Boundary & Auth AI Suite** | `node --test tests/public-auth-ai-boundaries.test.mjs` | `0` | 4/4 tests passed (oversized payload, markup, boundaries). | **PASS** |
| **Local Runtime Chat Endpoint** | `POST http://localhost:3000/api/ai/chat` | `0` | HTTP 200 OK received with text response; total latency **9,512 ms** (~9.5 seconds). | **REPRODUCED DEFECT** |

---

## 3. Real Defect Reproduction & Analysis

### Finding AI-001 (Groq Request Failure & 9.5s Cold Fallback)
- **Observed Behavior:** Sending a clean valid user prompt (`"Hello"`) to `/api/ai/chat` returned HTTP 200 with:
  ```json
  {
    "text": "Hi there! 👋 \nHow can I help you with Haris’s portfolio, projects, or blog today?"
  }
  ```
  However, Next.js server logs confirmed:
  ```
  POST /api/ai/chat 200 in 9512ms
  ```
- **Root Cause Confirmed:**
  1. `app/api/ai/chat/route.ts:144` uses:
     ```ts
     model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
     ```
  2. In `.env.local`, `GROQ_API_KEY` is present, but `GROQ_MODEL` is **unset**.
  3. The request attempts to query Groq with `openai/gpt-oss-20b`.
  4. Groq encounters an error/timeout and waits for the full 8-second deadline (`AbortSignal.timeout(8000)` at line 152).
  5. At ~8,000ms, Groq throws, and the code enters the Gemini fallback (`app/api/ai/chat/route.ts:168-195`).
  6. Gemini processes the prompt via `GOOGLE_AI_API_KEY` in ~1,500ms and returns the answer.
  7. **Total elapsed time: 9.51 seconds.**
- **Production Impact:** On Vercel Free/Hobby tier (10s max duration limit), a 9.51-second execution is right at the failure cliff. Any slight DNS latency or longer answer pushes execution over 10s, triggering an immediate `504 FUNCTION_INVOCATION_TIMEOUT` error.

---

## 4. Revalidation of Audit Claims

| Audit Claim | Revalidation Status | Evidence & Reality |
|---|---|---|
| **Groq model `openai/gpt-oss-20b` invalid** | `NEEDS VERIFICATION / STALE` | Groq's official catalog lists `openai/gpt-oss-20b` as a production model. The issue in practice was request timeout (8s) or account tier availability, not that the model name is intrinsically fictional. |
| **Gemini model `gemini-flash-latest` returns 403** | `NOT REPRODUCED (Resolved)` | Live test against Gemini using the active `GOOGLE_AI_API_KEY` generated valid text in 1.5s. The previous HTTP 403 logged in `AI_CHAT_RELEASE.md` is no longer blocking Gemini calls in the current environment. |
| **`site_settings` schema mismatch** | `CONFIRMED RISK` | `supabase_schema.sql` defines key-value (`key TEXT, value TEXT`), while `app/api/ai/chat/route.ts` selects named columns (`site_name, seo_description...`). Handled defensively by `try { ... } catch`, but risks empty context if deployed to a vanilla database. |
| **In-memory rate limit bypass** | `CONFIRMED` | `app/lib/rate-limit.ts` uses local `Map`. On Vercel lambdas, state is ephemeral and unshared. |
| **Absence of streaming** | `CONFIRMED` | Route uses `stream: false`; widget uses `response.json()`. Users wait 9.5s in complete silence. |

---

## 5. Owner Decisions Required Before Phase 1

1. **Assistant Launcher Style:** Confirm preference for the lightweight dimensional SVG/CSS animated assistant icon (subtle float/glow, dark/light aware, static for reduced-motion).
2. **Groq Primary Model:** Do you have a preferred Groq model in your Groq console (e.g. `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, or `openai/gpt-oss-20b`)? We will benchmark the exact response time in Phase 2.
3. **Vercel Plan:** Confirm if the portfolio is hosted on Vercel Hobby (10s limit) or Vercel Pro (60s limit). We design for the strict 10s ceiling by default.

---

## 6. Phase Acceptance Statement

Phase 0 baseline checks have completely passed. No code or database changes were made.

**STOP — awaiting owner approval to proceed to Phase 1 (Product Contract & Visual Design).**
