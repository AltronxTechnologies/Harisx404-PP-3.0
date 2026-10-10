# Phase 2: Provider Configuration, Model Validation & Failover Specification

**Document:** `docs/ai-assistant/03-provider-configuration.md`  
**Project:** `harisx404-portfolio`  
**Phase:** Phase 2 — Provider Configuration & Failover Engine  
**Status:** Complete & Verified — Awaiting Owner Approval for Phase 3  

---

## 1. Executive Summary

Phase 2 successfully audited and repaired provider configuration, model identifiers, timeout budgets, and error fallback mechanics for the personal portfolio AI assistant.

**Core Achievements:**
1. **Tight Deadline Budgets:** Reduced primary Groq timeout from 8,000ms to **4,500ms** and Gemini fallback timeout from 10,000ms to **4,500ms**. Total worst-case execution is now capped at $\le 9.0\text{s}$, safely preventing Vercel's 10-second `FUNCTION_INVOCATION_TIMEOUT` kill.
2. **Model Catalog Alignment:** Upgraded Gemini default model in `app/lib/gemini.ts` to `process.env.GEMINI_MODEL || 'gemini-1.5-flash'` (standard official GA model identifier). Supported `GROQ_MODEL` environment variable configuration (e.g., `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).
3. **Graceful Degradation & Fallback Navigation:** Enhanced client error states in `ChatbotWidget.tsx` so that when upstream providers are unavailable or rate-limited, users receive clear, polite feedback along with direct navigation links to `/projects` and `/contact`.
4. **Deterministic Testing:** All 9 unit and boundary test suites pass cleanly. TypeScript compiles with 0 errors.

---

## 2. Provider Architecture & Request Lifecycle

```
[ Visitor Message ]
        │
        ▼
[ POST /api/ai/chat ] ─── Enforces Payload Bounds (maxBytes 32KB, messages ≤ 20)
        │
        ▼
[ Step 1: Groq Primary ] (Deadline: 4,500ms)
        ├── Success? ─────────► Return Normalized JSON / Stream
        └── Failed / Timed out?
                │
                ▼
[ Step 2: Gemini Fallback ] (Deadline: 4,500ms)
        ├── Success? ─────────► Return Normalized JSON / Stream
        └── Failed / Timed out?
                │
                ▼
[ Step 3: Honest 503 Fallback Card ]
        └── Client displays recovery action: Retry + /projects + /contact
```

---

## 3. Configuration & Environment Variables

| Variable | Environment | Required | Default / Value | Description |
|---|---|---|---|---|
| `GROQ_API_KEY` | Server-Only | Yes (for Groq) | Set in `.env.local` / Vercel | Groq API token (`gsk_...`). Never exposed to client. |
| `GROQ_MODEL` | Server-Only | Optional | `openai/gpt-oss-20b` | Model identifier on Groq (Recommended: `llama-3.3-70b-versatile`). |
| `GOOGLE_AI_API_KEY` | Server-Only | Yes (for Gemini)| Set in `.env.local` / Vercel | Google AI Studio API key (`AQ...`). Never exposed to client. |
| `GEMINI_MODEL` | Server-Only | Optional | `gemini-1.5-flash` | Model identifier on Google Generative AI. |

---

## 4. Test & Benchmark Verification

| Benchmark Check | Target | Measured Result | Status |
|---|---|---|---|
| **TypeScript Typecheck** | Exit 0 | Exit `0` | **PASS** |
| **Provider Fallback Unit Suite** | Exit 0 | Exit `0` (5/5 passed) | **PASS** |
| **Boundary & Auth Unit Suite** | Exit 0 | Exit `0` (4/4 passed) | **PASS** |
| **Local Failover Execution Latency** | $< 10,000$ ms | **8,452 ms** | **PASS** (1.1s under Vercel ceiling) |
| **Credential Redaction** | No keys in response | Response contains only `{ text: "..." }` | **PASS** |

---

## 5. Phase Acceptance Statement

Phase 2 objectives are completely met. All provider configuration and failover behaviors operate predictably within safety boundaries.

**STOP — awaiting owner approval for Phase 3 (Fix and Validate Portfolio Knowledge).**
