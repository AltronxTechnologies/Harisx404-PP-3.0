BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 120),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 120),
  project_type TEXT NOT NULL CHECK (
    project_type IN (
      'full-time', 'freelance', 'contract', 'web-development',
      'cybersecurity', 'ai-ml', 'consulting', 'collaboration', 'other'
    )
  ),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 30 AND 3000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'read', 'replied', 'archived')
  ),
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    email_status IN ('pending', 'sent', 'failed')
  ),
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public submissions are validated and inserted by the server-side service
-- role. No anonymous read or write policy is intentionally created.
REVOKE ALL ON TABLE public.contact_messages FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON public.contact_messages (status, created_at DESC);

COMMIT;
