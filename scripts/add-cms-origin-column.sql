ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS cms_origin boolean NOT NULL DEFAULT false;
