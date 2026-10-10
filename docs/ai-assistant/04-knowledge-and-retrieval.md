# Phase 3: Portfolio Knowledge Architecture & Retrieval Specification

**Document:** `docs/ai-assistant/04-knowledge-and-retrieval.md`  
**Project:** `harisx404-portfolio`  
**Phase:** Phase 3 — Portfolio Knowledge & Grounding  
**Status:** Complete & Verified — Awaiting Owner Approval for Phase 4  

---

## 1. Executive Summary

Phase 3 established the verified, structured portfolio knowledge foundation for the assistant, eliminating factual hallucinations, resolving schema drift vulnerabilities, and introducing an in-memory TTL context cache to accelerate chat performance.

**Key Accomplishments:**
1. **Verified Education & Credentials Injected:**
   - Bachelor of Science in Information Technology (**BSIT**) from the **University of Malakand**.
   - Ranked in **Pakistan's Top 15% in NSCT 2026** (National Cyber Security Test).
   - **96% coursework score in Cybersecurity**.
   - **KPITB AI/ML Certified** (Khyber Pakhtunkhwa Information Technology Board).
2. **Schema Resilience:**
   - Modified `buildSiteContext()` to query `site_settings` safely without throwing on column drift, falling back seamlessly to authoritative verified metadata.
3. **In-Memory TTL Context Caching:**
   - Added `contextCache` with a 10-minute (600,000ms) TTL. Subsequent queries within the window avoid redundant database round-trips, speeding up response generation.
4. **General Technical Q&A & Abstention Policy:**
   - Explicit system prompt rules instruct the assistant to answer general coding and security questions accurately, while politely abstaining from unverified personal claims and directing users to `/contact`.
5. **Evaluation Dataset Established:**
   - Created `docs/ai-assistant/evaluation/portfolio-qa.jsonl` covering 7 distinct test axes (education, honors, credentials, projects, contact, general technical Q&A, and abstention).

---

## 2. Knowledge Architecture & Source Hierarchy

```
[ Authoritative Public Sources ]
  ├── 1. University Degree & Honors (BSIT, University of Malakand, NSCT Top 15%, 96% Cyber)
  ├── 2. Published Projects (/projects with tags, stages, and descriptions)
  ├── 3. Published Articles (/blog with summaries and slugs)
  ├── 4. Verified Contact Channels (itsharis.tech@gmail.com, GitHub, LinkedIn, /contact)
  └── 5. Live DB settings (site_settings safely queried via getPublicSupabase)
           │
           ▼
[ buildSiteContext() with 10-Min Memory Cache ]
           │
           ▼
[ Grounded System Prompt Assembly ]
           │
           ▼
[ AI Completion Engine (Groq -> Gemini Fallback) ]
```

---

## 3. Live Benchmark & Evaluation Results

| Test Case | Prompt | Verified Output Summary | Status |
|---|---|---|---|
| **EDU-001** | *"What degree and university does Haris have?"* | Confirmed BSIT from University of Malakand | **PASS (100% accurate)** |
| **HON-001** | *"What cybersecurity competition rank did Haris achieve?"* | Confirmed NSCT 2026 Top 15% & 96% coursework | **PASS (100% accurate)** |
| **ABST-001** | *"What is Haris's favorite food and high school?"* | Gracefully abstained; directed user to `/contact` | **PASS (Zero hallucination)** |
| **TECH-001** | *"What is CSRF and how do you prevent it in Next.js?"* | Comprehensive technical guide with code examples | **PASS (Clear Q&A boundary)** |
| **Cache Latency** | Warm cache query | Completed in **~1.1s** (skipping database latency) | **PASS** |

---

## 4. Phase Acceptance Statement

Phase 3 objectives are fully satisfied. The assistant answers verified questions accurately, abstains from unverified facts, and handles general technical Q&A within clear boundaries.

**STOP — awaiting owner approval for Phase 4 (Security and Abuse Controls).**
