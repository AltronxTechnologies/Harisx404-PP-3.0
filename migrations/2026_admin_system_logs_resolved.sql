-- Admin log review needs a persisted resolution state. The public logger keeps
-- insert-only access; Admin reads and mutations use a verified service-role path.
ALTER TABLE public.system_logs
  ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS system_logs_resolved_created_at_idx
  ON public.system_logs (resolved, created_at DESC);
