BEGIN;

ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_project_type_check;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_project_type_check CHECK (
    project_type IN (
      'full-time', 'freelance', 'contract', 'web-development',
      'cybersecurity', 'ai-ml', 'consulting', 'collaboration', 'other'
    )
  );

COMMIT;
