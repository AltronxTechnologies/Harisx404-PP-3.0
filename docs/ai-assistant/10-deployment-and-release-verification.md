# Deployment Verification, Environment Checklist & Production Release Runbook

**Phase:** Phase 9 — Preview Deployment & Production Release Verification  
**Status:** Verification Ready  
**Date:** October 10, 2026  
**Artifact:** `docs/ai-assistant/10-deployment-and-release-verification.md`  
**Target:** `harisx404-portfolio`

---

## 1. Executive Summary

Phase 9 establishes the deployment verification procedures, environment-variable configurations, secret protection audits, and emergency rollback procedures for the Harisx404 Portfolio AI Assistant.

---

## 2. Environment Variables Checklist

### 2.1 Server-Side AI Secrets (Strictly Private)

Ensure the following variables are configured in the Vercel Dashboard (**Project Settings $\to$ Environment Variables**):

| Variable Name | Required | Target Environments | Recommended Value | Purpose |
|---|:---:|:---:|---|---|
| `GROQ_API_KEY` | **Yes** | Production, Preview | `gsk_...` | Primary LLM inference API key |
| `GROQ_MODEL` | No | Production, Preview | `openai/gpt-oss-20b` | Pin model ID; avoid dynamic catalog discovery |
| `GOOGLE_AI_API_KEY` | Optional | Production, Preview | `AIzaSy...` | Secondary failover key from Google AI Studio |
| `GEMINI_MODEL` | No | Production, Preview | `gemini-2.5-flash` | Pinned Gemini model identifier |
| `AI_ASSISTANT_DISABLED` | No | Production, Preview | `false` | Emergency circuit breaker (set to `true` to pause assistant) |
| `ENABLE_AI_TELEMETRY` | No | Production, Preview | `false` | Redacted operational metrics logging |

> [!CAUTION]
> **Zero Public Leakage:** Under NO circumstances should `GROQ_API_KEY`, `GOOGLE_AI_API_KEY`, `GEMINI_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` be prefixed with `NEXT_PUBLIC_`. All AI inference occurs strictly server-side in `app/api/ai/chat/route.ts`.

---

## 3. Serverless Runtime & Timeout Invariants

### 3.1 Vercel Function Execution Budget
- **Serverless Limit:** Vercel Hobby functions default to a 10-second hard execution ceiling.
- **Enforced Budget:**
  - Primary Groq Streaming Deadline: **4.5s** (`AbortSignal.timeout(4500)`).
  - Secondary Gemini Fallback Deadline: **4.5s** (Race timeout).
  - Worst-Case Cumulative Ceiling: **$\le 9.0\text{s}$**, strictly preventing `504 Gateway Timeout` or `FUNCTION_INVOCATION_TIMEOUT` kills.
- **Failover Boundary Invariant:** Fallback to Gemini is permitted **strictly before** the first token is emitted (`tokensEmitted === 0`). If an upstream error occurs mid-stream (`tokensEmitted > 0`), the server emits `STREAM_INTERRUPTED` without mixing models.

---

## 4. Pre-Release Smoke Test Suite

Upon deployment to Vercel Preview or Production, execute the following verification smoke tests:

### 4.1 Minimal Non-Streaming Ping
```bash
curl -X POST https://<preview-domain>/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What degree does Haris have?"}]}'
```
- **Expected:** `200 OK`, JSON payload containing `reply` mentioning `BSIT` from `University of Malakand`, header `X-Request-ID`.

### 4.2 SSE Progressive Streaming
```bash
curl -N -X POST https://<preview-domain>/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"messages": [{"role": "user", "content": "What is IntruShield NIDS?"}], "stream": true}'
```
- **Expected:** `200 OK`, `Content-Type: text/event-stream`, progressive `event: start`, `event: delta`, and `event: done` chunks with `X-Request-ID`.

### 4.3 Security & Abuse Boundaries
```bash
# 1. System role rejection:
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<preview-domain>/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "system", "content": "tamper"}]}'
# Expected: 400

# 2. Unsupported media type rejection:
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<preview-domain>/api/ai/chat \
  -H "Content-Type: multipart/form-data" \
  -d 'dummy'
# Expected: 415
```

---

## 5. Emergency Rollback Procedures

If upstream provider outages, quota exhaustion, or unexpected regressions occur post-release, apply one of the following immediate mitigations:

### Level 1: Instant Server-Side Circuit Breaker (No Redeploy Required)
1. Go to **Vercel Dashboard $\to$ Project $\to$ Settings $\to$ Environment Variables**.
2. Add / Edit: `AI_ASSISTANT_DISABLED="true"`.
3. Save changes. The endpoint will immediately short-circuit to `503 Service Unavailable` with zero upstream provider queries, zero database load, and clear recovery links to `/projects` and `/contact`.

### Level 2: Vercel Instant Rollback (Zero Downtime)
1. Navigate to **Vercel Dashboard $\to$ Deployments**.
2. Locate the previous verified stable deployment.
3. Click the **`...`** menu and select **Instant Rollback**.
4. Traffic is redirected immediately to the previous deployment build.

### Level 3: Git Revert (If Codebase Requires Reversion)
```bash
# Revert the AI assistant release commit cleanly:
git revert <release-commit-hash> --no-edit
git push origin main
```

---

## 6. Git Status & Safety Confirmation

- **Current Repository Status:**
  - `M app/api/ai/chat/route.ts`
  - `M app/components/ChatbotWidget.tsx`
  - `M app/lib/gemini.ts`
  - `M .env.example`
- **Zero unwanted or unrelated modifications:** Verified.
- **Zero commits or pushes made:** Strictly awaiting owner sign-off.
