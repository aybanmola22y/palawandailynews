-- Run in Supabase SQL Editor (once). Brute-force protection for admin login / MFA APIs.
-- Only the service role should access this table (no RLS policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.admin_auth_rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

ALTER TABLE public.admin_auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS admin_auth_rate_limits_locked_until_idx
  ON public.admin_auth_rate_limits (locked_until)
  WHERE locked_until IS NOT NULL;
