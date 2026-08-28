# ?? AI Integration Guide

---

## 1. AI Provider

**Google Gemini API** (via @google/generative-ai)
- Free tier: 1,500 requests/day (Gemini 1.5 Flash)
- No credit card required for free tier
- Get API key at: https://aistudio.google.com/apikey

```env
GOOGLE_AI_API_KEY=your_api_key_here
```

---

## 2. AI Features Map

### 2.1 Admin: Writing Assistant (Phase 4, Priority 1)

**Location:** /admin/blog/new and /admin/blog/[slug]
**Model:** Gemini 1.5 Flash

| Button | Input | Output |
|---|---|---|
| Improve paragraph | Selected text | Improved version of the text |
| Generate summary | Full blog content | 1-2 sentence summary |
| Suggest title | Full blog content | 3 title options |
| Suggest tags | Full blog content | List of relevant tags |
| Fix grammar | Selected text | Grammar-corrected text |

**API Route:** `POST /api/ai/assist`
```json
{
  "action": "improve|summary|title|tags|grammar",
  "content": "text to process",
  "context": "optional: full post content for context"
}
```

### 2.2 Blog: Semantic Search (Phase 4, Priority 2)

**Location:** /blog page — search box
**Model:** Gemini text-embedding-004 (embeddings) + Gemini 1.5 Flash (ranking)

**How it works:**
1. User types search query
2. Query sent to /api/ai/search
3. Gemini converts query to embedding vector
4. Compare against pre-computed post embeddings in Supabase (pgvector)
5. Return top N matching posts ranked by semantic similarity
6. Fallback: simple keyword search if embeddings not available

**Implementation Note:** Requires pgvector extension on Supabase.
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE blog_posts ADD COLUMN content_embedding vector(768);
```

### 2.3 Public: AI Chatbot Widget (Phase 4, Priority 3)

**Location:** Floating button on all public pages (bottom-right)
**Model:** Gemini 1.5 Flash with system prompt

**System Prompt Template:**
```
You are an AI assistant for Haris (harisx404), a full-stack developer.
You can only answer questions based on the following information about Haris:

[ABOUT]: {about_content from DB}
[PROJECTS]: {list of published projects from DB}
[SKILLS]: {list of skills/tools from DB}
[BLOG TOPICS]: {list of blog categories from DB}

Rules:
- Only answer questions about Haris and his work
- If asked something outside this context, say "I can only help with questions about Haris"
- Be helpful, friendly, and concise
- Never make up information about Haris
```

**API Route:** `POST /api/ai/chat`
```json
{
  "messages": [{"role": "user", "content": "What projects has Haris built?"}],
  "context": "pre-fetched site context object"
}
```

### 2.4 Admin: Project Description Generator (Phase 4, Priority 4)

**Location:** /admin/projects/new
**Model:** Gemini 1.5 Flash

**Feature:**
- Input: GitHub repository URL
- Action: Fetch README.md content (via GitHub API)
- Gemini: Generate a professional project description + suggest tags

**API Route:** `POST /api/ai/project-from-github`
```json
{
  "github_url": "https://github.com/username/repo"
}
```

### 2.5 Blog: Related Posts (AI-Enhanced, Phase 4, Priority 5)

**Location:** Bottom of each /blog/[slug] page
**Enhancement:** Currently uses simple category matching. AI upgrade uses semantic similarity.

---

## 3. Implementation Plan

### Step 1: Create Gemini Client (app/lib/gemini.ts)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

export const geminiPro = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
});

export async function generateText(prompt: string): Promise<string> {
  const result = await geminiFlash.generateContent(prompt);
  return result.response.text();
}
```

### Step 2: Create AI API Routes
- `app/api/ai/assist/route.ts` — Writing assistant
- `app/api/ai/chat/route.ts` — Chatbot
- `app/api/ai/search/route.ts` — Semantic search

### Step 3: Add Rate Limiting to AI Routes
```typescript
// Prevent abuse of AI endpoints
const RATE_LIMIT = 20; // requests per hour per IP
```

---

## 4. Cost Management

| Feature | Requests/Day (est.) | Gemini Cost (Free) |
|---|---|---|
| Writing assistant | ~20 (admin only) | Free |
| Chatbot | ~50 (visitors) | Free |
| Search | ~100 | Free |
| Project gen | ~5 (admin only) | Free |
| **Total** | **~175/day** | **Well within 1500 limit** |

If traffic grows, Gemini API pricing:
- Gemini 1.5 Flash: $0.075 per 1M input tokens (very cheap)
- A typical blog assistant call: ~500 tokens = $0.0000375 per call

---

## 5. AI Safety Rules

- NEVER send sensitive data (API keys, admin credentials) to Gemini
- NEVER allow user input to directly modify system prompts (prompt injection)
- ALWAYS validate and sanitize AI output before displaying to users
- ALWAYS have a fallback if AI fails (graceful degradation)
- Rate limit all AI API endpoints to prevent abuse
