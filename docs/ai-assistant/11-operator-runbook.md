# Harisx404 AI Assistant: Post-Release Operator Runbook

**Document:** Production Operations & Maintenance Manual  
**Phase:** Phase 10 — Post-Release Runbook & Maintenance Monitoring  
**Target:** `harisx404-portfolio`  
**Audience:** Muhammad Haris (Portfolio Owner & Maintainer)  
**Artifact:** `docs/ai-assistant/11-operator-runbook.md`  

---

## 1. Quick Reference: Common Operator Actions

| Action | How to Execute | Downtime | Redeploy Needed? |
|---|---|:---:|:---:|
| **Emergency Pause (Disable AI)** | Set `AI_ASSISTANT_DISABLED="true"` in Vercel Environment Variables | None | **No** (Instant) |
| **Restore AI Service** | Set `AI_ASSISTANT_DISABLED="false"` in Vercel Environment Variables | None | **No** (Instant) |
| **Rotate Groq API Key** | Update `GROQ_API_KEY` in Vercel Environment Variables | None | **No** (Applies next invocation) |
| **Change Groq Model ID** | Update `GROQ_MODEL` in Vercel Environment Variables | None | **No** (Applies next invocation) |
| **Enable Telemetry Logs** | Set `ENABLE_AI_TELEMETRY="true"` in Vercel Environment Variables | None | **No** |
| **Purge Context Cache** | Serverless function cold start automatically refreshes (10m TTL) | None | **No** |

---

## 2. Emergency Circuit Breaker (Disabling the Assistant)

If upstream providers experience unexpected outages, billing spikes, or severe rate-limiting:

### 2.1 How to Activate
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Go to **Project Settings $\to$ Environment Variables**.
3. Add or update:
   ```env
   AI_ASSISTANT_DISABLED="true"
   ```
4. Save.

### 2.2 What Happens
- Every incoming request to `/api/ai/chat` immediately returns:
  ```json
  {
    "error": "The AI assistant is temporarily paused for maintenance. You can explore Haris's work at /projects or reach out at /contact."
  }
  ```
  with HTTP status `503 Service Unavailable` and `Retry-After: 3600`.
- **Zero API calls** are made to Groq or Google Gemini (0 cost).
- **Zero database queries** are made to Supabase (0 DB load).
- The rest of the portfolio website remains 100% operational.
- Visitors seeing the assistant panel receive helpful fallback recovery links to `/projects` and `/contact`.

### 2.3 How to Restore
Change `AI_ASSISTANT_DISABLED` back to `"false"` or delete the variable in Vercel. Service restores immediately.

---

## 3. Model Lifecycle & Deprecation Updates

Upstream AI providers occasionally deprecate model identifiers (e.g. older Llama models or Gemini 1.5).

### 3.1 Official Deprecation Trackers
- **Groq Supported Models & Deprecations:** [https://console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations)
- **Google Gemini Model Catalog:** [https://ai.google.dev/gemini-api/docs/models/gemini](https://ai.google.dev/gemini-api/docs/models/gemini)

### 3.2 Safe Model Update Procedure
Never change model IDs blindly in production. Follow this 4-step checklist:

1. **Verify New Model ID in Catalog:**
   Confirm the new model supports chat completions and streaming (e.g., `openai/gpt-oss-20b`, `qwen/qwen3.6-27b` on Groq; `gemini-2.5-flash` on Google AI).
2. **Test Locally with Smoke Test:**
   ```bash
   GROQ_MODEL="<new-model-id>" node tests/ai-streaming-protocol.test.mjs
   ```
3. **Update Vercel Environment Variable:**
   In Vercel Project Settings, set `GROQ_MODEL="<new-model-id>"`.
4. **Verify Live Preview:**
   Send a test prompt in chat and confirm the response streams cleanly with `200 OK`.

---

## 4. Free-Tier Quota & Rate Limit Management

### 4.1 Groq Free-Tier Guardrails
- **Requests Per Minute (RPM):** 30 RPM limit on free tier.
- **Tokens Per Minute (TPM):** 6,000–14,400 TPM depending on model tier.
- **Application Safeguards:**
  - Per-IP rate limiting enforces 20 requests per minute window.
  - Bounded input: maximum 20 message turns, maximum 2,000 characters per message, maximum 20,000 characters total history.
  - Bounded output: `max_completion_tokens: 800`.
  - In-memory knowledge context cache (10-minute TTL) ensures Supabase DB reads are not executed repeatedly on warm serverless instances.

### 4.2 Handling 429 Rate Limits
- If Groq rate limits a visitor, the endpoint automatically falls back to secondary Gemini (if configured).
- If both providers are rate limited or unavailable, the endpoint returns a clear, non-technical notice with recovery navigation links.

---

## 5. Adding Secondary Provider (Google Gemini Fallback)

To activate Gemini failover:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a new free API key.
2. In Vercel Project Settings, configure:
   ```env
   GOOGLE_AI_API_KEY="AIzaSy..."
   GEMINI_MODEL="gemini-2.5-flash"
   ```
3. Save changes. The endpoint will automatically use Gemini as a silent fallback whenever Groq experiences transient 5xx, timeout, or quota exhaustion.

---

## 6. Updating Portfolio Knowledge & Grounding

When Haris graduates, earns a new certification, publishes a new project, or updates contact info:

### 6.1 Database-Driven Updates (Automatic)
The assistant automatically retrieves published records from Supabase:
- New published projects in `projects` table appear in retrieval.
- New published articles in `blog_posts` table appear in retrieval.
- Changes to `site_settings` (email, social URLs, site description) reflect within 10 minutes (cache TTL) or immediately on new serverless instances.

### 6.2 Hardcoded Baseline Credentials
To update core credentials (e.g. graduation year, new degree, competition honors):
1. Open `app/api/ai/chat/route.ts`.
2. Locate the `[VERIFIED PROFILE & CREDENTIALS]` block inside `buildSiteContext()`:
   ```ts
   parts.push(`[VERIFIED PROFILE & CREDENTIALS]
   - Name: Muhammad Haris (username: harisx404)
   - Role: Full-Stack Engineer, Cybersecurity Specialist & AI Developer
   - Education: Bachelor of Science in Information Technology (BSIT) graduate from University of Malakand
   - Academic & Competition Honors: Ranked in Pakistan's Top 15% in NSCT 2026; scored 96% in Cybersecurity coursework
   ...`);
   ```
3. Edit the facts with verified details.
4. Run regression tests:
   ```bash
   node --test tests/chat-provider-fallback.test.mjs tests/public-auth-ai-boundaries.test.mjs tests/ai-*.test.mjs
   ```
5. Deploy changes.

---

## 7. Observability & Privacy-Safe Telemetry

### 7.1 How to Enable Telemetry
In Vercel Project Settings:
```env
ENABLE_AI_TELEMETRY="true"
```

### 7.2 Structured Telemetry Format
When enabled, every chat interaction produces structured JSON in Vercel Function Logs:
```json
{
  "type": "ai_chat_telemetry",
  "timestamp": "2026-10-10T18:07:30.000Z",
  "requestId": "req_mv2pkifd_yfztv",
  "provider": "groq",
  "status": 200,
  "durationMs": 1101,
  "tokensEmitted": 42
}
```

### 7.3 Privacy Invariants
- **Zero Chat Text Logged:** Neither visitor queries nor assistant replies are ever printed to logs.
- **Zero IP Retention:** Raw IP addresses are stripped.
- **Zero Secret Exposure:** Upstream API keys and authorization headers are never logged.

---

## 8. Summary of Maintenance Schedule

| Cadence | Task | Action Item |
|---|---|---|
| **Monthly** | Deprecation Check | Check Groq and Google AI model deprecation pages |
| **Quarterly** | Evaluation Refresh | Run `docs/ai-assistant/evaluation/portfolio-qa.jsonl` against live endpoint |
| **On Credential Change** | Knowledge Update | Update `buildSiteContext()` in `route.ts` with new honors or certifications |
| **On Provider Outage** | Emergency Pause | Set `AI_ASSISTANT_DISABLED="true"` until incident resolves |
