-- One backup row per article (initial seed + each new CMS article).
-- Run once in Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.article_backups (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'News',
  author text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  date text NOT NULL DEFAULT '',
  reading_time text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_breaking boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Published',
  legacy_wp_id integer,
  cms_origin boolean NOT NULL DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz,
  backed_up_at timestamptz NOT NULL DEFAULT (timezone('utc', now())),
  backup_source text NOT NULL DEFAULT 'seed'
    CHECK (backup_source IN ('seed', 'create'))
);

CREATE INDEX IF NOT EXISTS article_backups_backed_up_at_idx
  ON public.article_backups (backed_up_at DESC);

ALTER TABLE public.article_backups ENABLE ROW LEVEL SECURITY;
