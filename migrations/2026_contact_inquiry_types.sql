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

COMMIT;
