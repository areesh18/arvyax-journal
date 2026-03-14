# Architecture

## System Overview

```
[React + Vite (Vercel)]
         |
         | HTTP (axios / fetch)
         v
[Express 5 API (Render)]
    |            |
    v            v
[PostgreSQL]  [Gemini API]
(neon)   (@google/genai)
```

The frontend is a single-page React app deployed on Vercel. The backend is a stateless Express 5 server deployed on Render, using ES modules (`"type": "module"`). It connects to a Supabase-hosted PostgreSQL database and calls the Gemini API server-side to keep the API key off the client.

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS journal_entries (
  id         SERIAL PRIMARY KEY,
  user_id    VARCHAR(100) NOT NULL,
  ambience   VARCHAR(50) NOT NULL,
  text       TEXT NOT NULL,
  emotion    VARCHAR(100),
  keywords   TEXT[],
  summary    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The analysis columns (`emotion`, `keywords`, `summary`) are nullable. Entries are stored immediately on save with these fields empty, and populated only when the user explicitly triggers analysis. This decouples write latency from LLM latency — saving an entry is instant, analysis is on demand.

`keywords` uses PostgreSQL's native `TEXT[]` array type. The insights route fetches all keyword arrays and aggregates frequency in JavaScript using `flatMap` and a frequency map.

---

## Request Flow

**Saving an entry:**
```
POST /api/journal
  → validate body (userId, ambience, text)
  → INSERT into journal_entries
  → return created row
```

**Analyzing an entry:**
```
POST /api/journal/analyze
  → analyzeLimiter checks IP (10 req/min)
  → call Gemini with entry text
  → parse JSON response (emotion, keywords, summary)
  → UPDATE journal_entries SET emotion, keywords, summary WHERE id = entryId
  → return analysis result
```

**Loading insights:**
```
GET /api/journal/insights/:userId
  → COUNT(*) for totalEntries
  → GROUP BY emotion ORDER BY count DESC LIMIT 1 → topEmotion
  → GROUP BY ambience ORDER BY count DESC LIMIT 1 → mostUsedAmbience
  → SELECT keywords WHERE keywords IS NOT NULL → flatten + frequency rank → recentKeywords
  → return aggregated object
```

---

## LLM Integration

File: `backend/services/llm.js`

Uses `@google/genai` SDK with `generateContent`. The model is instructed via `systemInstruction` to return valid JSON only. `responseMimeType: "application/json"` is set to enforce structured output at the API level. The response is read via `response.text` (a property on the SDK response object) and parsed with `JSON.parse`.

The prompt asks for exactly three fields: `emotion` (single word), `keywords` (array of 3 strings), `summary` (one sentence). This matches the spec output format exactly.

---

## Rate Limiting

Two `express-rate-limit` instances are applied in `index.js`:

- **Global limiter** — 100 requests per IP per 15 minutes, applied to all routes via `app.use(limiter)`
- **Analyze limiter** — 10 requests per IP per minute, applied specifically to `/api/journal/analyze` via `app.use("/api/journal/analyze", analyzeLimiter)`

The analyze route gets a stricter limit because each request makes a paid external API call to Gemini.

---

## 1. How would you scale this to 100k users?

**Database**

Add an index on `user_id` — all four queries filter by it and currently do full table scans:
```sql
CREATE INDEX idx_journal_user_id ON journal_entries(user_id);
```

Move to a managed PostgreSQL cluster with read replicas (Supabase Pro or AWS RDS). Route `GET` requests to replicas, writes to the primary.

The insights route currently makes 4 sequential DB queries per request. Consolidate into fewer queries or add a materialized view for insights that refreshes on each new entry.

**Backend**

The Express server is fully stateless — no session data, no in-memory state. This means horizontal scaling requires zero application changes. Run multiple instances behind a load balancer (Render, Railway, or Fly.io all support this).

Move LLM analysis to an async job queue (BullMQ + Redis). The `/analyze` endpoint enqueues a job and returns a `202 Accepted` immediately. A worker processes it and updates the DB. The frontend polls or uses SSE for the result. This prevents slow Gemini responses from blocking HTTP connections under load.

**Frontend**

Already on Vercel CDN — scales automatically.

Add pagination to `GET /api/journal/:userId` so the frontend doesn't load every entry at once as the user's journal grows.

---

## 2. How would you reduce LLM cost?

**Cache repeated analysis**

Before calling Gemini, hash the entry text (SHA-256) and check a cache table. If the same text was analyzed before, return the stored result without an API call:

```sql
CREATE TABLE analysis_cache (
  text_hash  TEXT PRIMARY KEY,
  emotion    VARCHAR(100),
  keywords   TEXT[],
  summary    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Batch analysis**

Instead of one Gemini call per entry, batch multiple entries into a single prompt requesting a JSON array of results. This directly reduces API calls for the "Analyze All" feature.

**Model selection**

Use the flash variant of Gemini (already in use) rather than the pro variant — significantly cheaper and more than sufficient for short emotion analysis on journal text.

**Prompt efficiency**

Keep the prompt minimal and avoid few-shot examples unless accuracy is poor — each extra example token is charged on every single call.

**On-demand only**

Already implemented — entries are not auto-analyzed on save. Users explicitly click Analyze. This avoids unnecessary API calls entirely.

---

## 3. How would you cache repeated analysis?

**Layer 1 — Entry-level (easiest, no extra infra)**

Before calling Gemini, check if the entry already has a non-null `emotion` in the DB. If yes, return the stored result without calling the API:

```js
const cached = await pool.query(
  `SELECT emotion, keywords, summary
   FROM journal_entries
   WHERE id = $1 AND emotion IS NOT NULL`,
  [entryId]
);
if (cached.rows.length > 0) return res.json(cached.rows[0]);
```

This prevents re-analyzing the same entry on repeated clicks at zero cost.

**Layer 2 — Text hash cache (cross-user deduplication)**

Hash the journal text and store results in a separate `analysis_cache` table keyed by hash. If two different users write identical or near-identical entries, only the first call hits Gemini. All subsequent calls return from the cache table instantly.

**Layer 3 — In-memory cache (hot path)**

Use `node-cache` or Redis to hold the last N analysis results in memory. Sub-millisecond lookups for recently analyzed entries without any DB round-trip.

Cache invalidation is not a concern here — analysis results are immutable. We never re-analyze the same entry text; edited text would be a new entry.

---

## 4. How would you protect sensitive journal data?

Journal entries contain personal mental health data and require careful protection at every layer.

**Transport**

All traffic runs over HTTPS — enforced by Vercel (frontend) and Render (backend). No plain HTTP in production.

CORS is currently open (`*`). In production, restrict to the frontend domain only:
```js
app.use(cors({ origin: "https://arvyax-journal-ruby.vercel.app" }));
```

**Authentication**

The current implementation uses email as a userId with no password or token — intentional for the assignment scope. In production, replace with JWT-based auth (Supabase Auth works well with this stack). Every API request would carry a signed token. The server verifies the token and checks that the `userId` in the token matches the resource being accessed. This prevents user A from reading user B's entries by guessing their email.

**Database**

Enable Row Level Security on Supabase so the database itself enforces user isolation — even if the API layer is bypassed:
```sql
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON journal_entries
  USING (user_id = current_setting('app.current_user_id'));
```

Never log entry text content in server logs. Log only entry IDs and anonymised identifiers for debugging.

**LLM data handling**

Gemini API calls send journal text to Google's servers. For a production mental health app, review Google's data retention and processing policies. Consider an on-premise or private LLM deployment for high-sensitivity use cases.

**Rate limiting**

Already implemented — protects against brute-force enumeration of user IDs and prevents API quota abuse on the analyze endpoint.