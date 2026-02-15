-- ==========================================================
-- emoDiary Database Migration
-- Run this entire script in Supabase SQL Editor
-- ==========================================================

-- ──────────────────────────────────────────────────────────
-- 1. PROFILES (linked 1:1 to auth.users)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  language      TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 2. USER SETTINGS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  language            TEXT DEFAULT 'en',
  tts_voice           TEXT DEFAULT 'en-IN-Wavenet-D',
  tts_speed           FLOAT DEFAULT 1.0,
  data_retention_days INT DEFAULT 365,
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 3. JOURNAL ENTRIES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT NOT NULL,
  emotion_tag TEXT,
  word_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id, created_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own journal entries"
  ON public.journal_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 4. CHAT SESSIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL CHECK (mode IN ('text', 'voice')),
  language    TEXT DEFAULT 'en',
  started_at  TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  duration_s  INT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.chat_sessions(user_id, started_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 5. CHAT MESSAGES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON public.chat_messages(session_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own chat messages"
  ON public.chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- 6. EMOTION ANALYSES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emotion_analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type     TEXT NOT NULL CHECK (source_type IN ('journal', 'chat')),
  source_id       UUID NOT NULL,
  sentiment_score FLOAT,
  emotions        JSONB DEFAULT '{}',
  primary_emotion TEXT DEFAULT 'neutral',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotions_user ON public.emotion_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotions_source ON public.emotion_analyses(source_type, source_id);

ALTER TABLE public.emotion_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own emotion analyses"
  ON public.emotion_analyses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 7. PATTERNS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patterns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  description  TEXT NOT NULL,
  data         JSONB DEFAULT '{}',
  detected_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON public.patterns(user_id, detected_at DESC);

ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own patterns"
  ON public.patterns FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 8. AUTO-CREATE PROFILE ON SIGN-UP (TRIGGER)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  INSERT INTO public.user_settings (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- DONE! All tables, indexes, RLS policies, and triggers created.
-- ──────────────────────────────────────────────────────────
