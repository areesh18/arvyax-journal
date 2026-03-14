# ArvyaX Soul Journal

An AI-assisted journal system built for the ArvyaX Full-Stack Assignment. Users complete immersive nature sessions (forest, ocean, mountain), write journal entries, and get LLM-powered emotion analysis with insights over time.

**Live Demo:** https://arvyax-journal-ruby.vercel.app/

> Use `demo@arvyax.com` to explore a pre-populated account with analyzed entries and insights already generated.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4 |
| Backend | Node.js, Express 5 (ESM) |
| Database | PostgreSQL (Supabase) |
| LLM | Google Gemini via `@google/genai` SDK |
| Hosting | Vercel (frontend), Render (backend) |

---

## Project Structure

```
arvyax-journal/
├── backend/
│   ├── db/
│   │   └── index.js        # PostgreSQL connection pool 
│   ├── routes/
│   │   └── journal.js      # All API routes
│   ├── services/
│   │   └── llm.js          # Gemini LLM integration
│   └── index.js            # Express app, rate limiting, table creation
├── frontend/
│   └── src/
│       ├── App.tsx          # Root — manages userId state
│       ├── Login.tsx        # Email-based login screen
│       ├── Journal.tsx      # Main journal UI
│       └── types.ts         # JournalEntry and Insights interfaces
├── README.md
└── ARCHITECTURE.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/journal` | Create a new journal entry |
| POST | `/api/journal/analyze` | Analyze an entry's emotion via LLM |
| GET | `/api/journal/insights/:userId` | Get aggregated insights for a user |
| GET | `/api/journal/:userId` | Get all entries for a user |

### POST `/api/journal`

Request:
```json
{
  "userId": "user@example.com",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain."
}
```

Response: the created entry row including `id` and `created_at`.

### POST `/api/journal/analyze`

Request:
```json
{
  "entryId": 1,
  "text": "I felt calm today after listening to the rain."
}
```

Response:
```json
{
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session."
}
```

The entry row is also updated in the database with these values.

### GET `/api/journal/insights/:userId`

Response:
```json
{
  "totalEntries": 8,
  "topEmotion": "calm",
  "mostUsedAmbience": "forest",
  "recentKeywords": ["focus", "nature", "rain", "peace", "calm"]
}
```

`recentKeywords` are ranked by frequency across all analyzed entries for that user.

### GET `/api/journal/:userId`

Returns an array of all entries ordered by `created_at DESC`.

---

## Running Locally

### Prerequisites
- Node.js >= 18
- A PostgreSQL database (Supabase free tier works)
- Google Gemini API key — get one free at [aistudio.google.com](https://aistudio.google.com)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```
DATABASE_URL=your_supabase_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server starts on the port defined by the `PORT` environment variable. Render injects this automatically. For local development, add `PORT=3000` to your `.env`.

The `journal_entries` table is created automatically on first run — no migration step needed.

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs on `http://localhost:5173`. By default the API URL falls back to `http://localhost:3000/api/journal`. To override it, create a `.env` file in `frontend/`:
```
VITE_API_URL=https://your-backend.onrender.com/api/journal
```

---

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (SSL required) |
| `GEMINI_API_KEY` | Google Gemini API key |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full base URL of backend API including `/api/journal` |

---

## Rate Limiting

Two limiters are applied server-side via `express-rate-limit`:

| Scope | Window | Limit |
|-------|--------|-------|
| All routes | 15 minutes | 100 requests per IP |
| `POST /api/journal/analyze` only | 1 minute | 10 requests per IP |

The analyze route has a stricter limit because each call hits the Gemini API.

---

## Authentication Note

Login is email-only with no password — the email is stored in `localStorage` and sent as `userId` in each request. This is intentional for the scope of this assignment. In production this would be replaced with JWT-based authentication.