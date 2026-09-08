BEGIN;

ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_project_type_check;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_project_type_check CHECK (
    project_type IN (
      'general-question', 'project-inquiry', 'freelance', 'full-time',
      'security-report', 'website-issue', 'consulting', 'collaboration', 'other'
    )
  );

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS request_id UUID,
  ADD COLUMN IF NOT EXISTS email_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_email_attempt_at TIMESTAMPTZ;

UPDATE public.contact_messages
SET request_id = gen_random_uuid()
WHERE request_id IS NULL;

ALTER TABLE public.contact_messages
  ALTER COLUMN request_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_request_id_idx
  ON public.contact_messages (request_id);

CREATE TABLE IF NOT EXISTS public.contact_message_rate_limits (
  signal_hash TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (signal_hash, window_started_at)
);

ALTER TABLE public.contact_message_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contact_message_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit(
  target_signal_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_window TIMESTAMPTZ;
  updated_count INTEGER;
BEGIN
  target_window := to_timestamp(
    floor(extract(epoch FROM NOW()) / 600) * 600
  );

  DELETE FROM public.contact_message_rate_limits
  WHERE window_started_at < NOW() - INTERVAL '1 day';

  INSERT INTO public.contact_message_rate_limits (
    signal_hash,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (target_signal_hash, target_window, 1, NOW())
  ON CONFLICT (signal_hash, window_started_at) DO UPDATE
  SET
    request_count = public.contact_message_rate_limits.request_count + 1,
    updated_at = NOW()
  WHERE public.contact_message_rate_limits.request_count < 3
  RETURNING request_count INTO updated_count;

  RETURN updated_count IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.check_contact_message_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_contact_message_rate_limit(TEXT) TO service_role;

COMMIT;
