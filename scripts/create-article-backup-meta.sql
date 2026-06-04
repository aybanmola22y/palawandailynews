-- Tracks when an admin last downloaded a CSV backup (for "new articles" notifications).
-- Run once in Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.article_backup_meta (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_backup_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT (timezone('utc', now()))
);

INSERT INTO public.article_backup_meta (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.article_backup_meta ENABLE ROW LEVEL SECURITY;
