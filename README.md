# emoDiary

> AI-powered emotional wellness journal built for India — write, speak, and understand your emotions.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/AI-Llama%20via%20Groq-F55036)](https://groq.com)

---

## What it does

emoDiary lets users journal their emotions and have real-time voice conversations with an AI companion. Every entry is analysed by **Llama (via Groq)** to extract multi-label emotion tags and generate a detailed sentiment report. The voice session pipeline uses **Groq Whisper** for transcription and **Sarvam AI** for natural Indian-language speech synthesis.

Built for **Hindi, Hinglish, Gujarati, and English** — because mental health support should speak your language.

---

## Check the Demo Video:

[![Watch Demo](./emoDiary.png)](https://youtu.be/HzANcjykNO4)

## Features

- **AI Journal** — Write freely; AI generates emotion tags, a title, and a full sentiment report
- **Voice Therapy Sessions** — Real-time voice conversation with a talking avatar (VAD → Whisper → Llama → Sarvam TTS)
- **Emotional Insights** — Mood trends, emotion distribution charts, and daily streaks
- **Therapist Score** — AI computes a clinical relevance score; triggers curated therapist recommendation cards with referral code *"EmoDiary"*
- **Multi-language** — English, Hindi, Hinglish, Gujarati (switchable mid-session)
- **Custom Avatar** — Configurable appearance with real-time lip sync during voice sessions
- **Free Model** — Unlimited journal entries and unlimited voice therapy sessions (no payments)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), Uvicorn |
| Database | Supabase (PostgreSQL + Row-Level Security) |
| AI (LLM) | Llama 3 via Groq API |
| AI (STT) | Whisper via Groq API |
| AI (TTS) | Sarvam AI (Indian language voices) |
| Payments | None (completely free) |
| Caching | Upstash Redis |

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project
- API keys: Groq, Sarvam AI

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your keys:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
SARVAM_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
CORS_ORIGINS=http://localhost:3000
```

Run the database migration in **Supabase SQL Editor** → paste contents of `backend/migration.sql` → Run.

Start the server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) — set root dir to `frontend` |
| Backend | [Render](https://render.com) — set root dir to `backend`, start cmd: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

Set all environment variables on each platform and update `CORS_ORIGINS` on the backend to your Vercel URL.

---

## Business Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | ₹0 | Unlimited (journals + voice sessions) |

---

## Project Structure

```
emoDiary/
├── backend/
│   ├── app/
│   │   ├── routers/        # journal, chat, voice, subscription, analytics
│   │   ├── services/       # AI, voice, subscription logic
│   │   ├── models/         # DB access + Pydantic schemas
│   │   └── prompts/        # Llama system prompts
│   ├── migration.sql
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (protected)/ # dashboard, journal, talk, insights, upgrade
│       │   └── (auth)/      # sign-in, sign-up
│       ├── components/      # avatar, subscription, UI
│       └── hooks/           # useSubscription, etc.
│
└── project_end.md           # Full product & business documentation
```

---

## License

MIT
