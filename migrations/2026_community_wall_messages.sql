BEGIN;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  patternindex INTEGER NOT NULL DEFAULT 0,
  rotation INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  creator_name TEXT NOT NULL DEFAULT 'Anonymous',
  creator_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  status_was_missing boolean;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'status'
  ) INTO status_was_missing;

  ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

  IF status_was_missing THEN
    UPDATE public.messages SET status = 'published';
  END IF;
END;
$$;

UPDATE public.messages
SET
  message = CASE
    WHEN char_length(btrim(message)) = 0 THEN 'Legacy note unavailable'
    ELSE btrim(message)
  END,
  creator_name = left(COALESCE(NULLIF(btrim(creator_name), ''), 'Visitor'), 80),
  creator_avatar_url = CASE
    WHEN creator_avatar_url ~ '^https://' THEN creator_avatar_url
    ELSE NULL
  END,
  patternindex = ((patternindex % 24) + 24) % 24,
  rotation = greatest(-3, least(3, rotation)),
  status = CASE
    WHEN char_length(btrim(message)) = 0 THEN 'archived'
    ELSE status
  END;

ALTER TABLE public.messages ALTER COLUMN status SET DEFAULT 'published';

WITH ranked_accounts AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id ORDER BY created_at DESC, id DESC
  ) AS account_note
  FROM public.messages
  WHERE user_id IS NOT NULL
)
UPDATE public.messages AS message
SET user_id = NULL
FROM ranked_accounts
WHERE message.id = ranked_accounts.id
  AND ranked_accounts.account_note > 1;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_check,
  DROP CONSTRAINT IF EXISTS community_wall_message_length,
  DROP CONSTRAINT IF EXISTS community_wall_creator_name_length,
  DROP CONSTRAINT IF EXISTS community_wall_pattern_range,
  DROP CONSTRAINT IF EXISTS community_wall_rotation_range,
  DROP CONSTRAINT IF EXISTS community_wall_status,
  DROP CONSTRAINT IF EXISTS community_wall_avatar_https;

ALTER TABLE public.messages
  ADD CONSTRAINT community_wall_message_length
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 200),
  ADD CONSTRAINT community_wall_creator_name_length
    CHECK (char_length(btrim(creator_name)) BETWEEN 1 AND 80),
  ADD CONSTRAINT community_wall_pattern_range
    CHECK (patternindex BETWEEN 0 AND 23),
  ADD CONSTRAINT community_wall_rotation_range
    CHECK (rotation BETWEEN -3 AND 3),
  ADD CONSTRAINT community_wall_status
    CHECK (status IN ('pending', 'published', 'archived')),
  ADD CONSTRAINT community_wall_avatar_https
    CHECK (creator_avatar_url IS NULL OR creator_avatar_url ~ '^https://');

CREATE INDEX IF NOT EXISTS community_wall_public_order_idx
  ON public.messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_wall_user_rate_idx
  ON public.messages (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_community_wall_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

DROP INDEX IF EXISTS public.community_wall_user_rate_idx;
CREATE UNIQUE INDEX IF NOT EXISTS community_wall_one_note_per_user_idx
  ON public.messages (user_id) WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_community_wall_updated_at ON public.messages;
CREATE TRIGGER set_community_wall_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_community_wall_updated_at();

CREATE OR REPLACE FUNCTION public.submit_community_wall_message(
  p_user_id UUID,
  p_message TEXT,
  p_patternindex INTEGER,
  p_rotation INTEGER,
  p_creator_name TEXT,
  p_creator_avatar_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  submitted_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  IF EXISTS (SELECT 1 FROM public.messages WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'already_submitted' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.messages (
    message, patternindex, rotation, user_id, creator_name,
    creator_avatar_url, status, moderated_at
  ) VALUES (
    p_message, p_patternindex, p_rotation, p_user_id, p_creator_name,
    p_creator_avatar_url, 'published', clock_timestamp()
  ) RETURNING id INTO submitted_id;
  RETURN submitted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_community_wall_message(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.submit_community_wall_message(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO service_role;
  END IF;
END;
$$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert their own notes" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.messages;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;

DROP VIEW IF EXISTS public.public_community_wall_messages;
CREATE VIEW public.public_community_wall_messages
WITH (security_barrier = true)
AS
SELECT id, message, patternindex, creator_name, creator_avatar_url, created_at
FROM public.messages
WHERE status = 'published'
ORDER BY created_at DESC;

REVOKE ALL ON TABLE public.public_community_wall_messages FROM PUBLIC;
GRANT SELECT ON TABLE public.public_community_wall_messages TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_wall_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  kicker TEXT NOT NULL,
  heading TEXT NOT NULL,
  heading_accent TEXT NOT NULL,
  description TEXT NOT NULL,
  collection_label TEXT NOT NULL,
  sign_in_title TEXT NOT NULL,
  sign_in_description TEXT NOT NULL,
  composer_title TEXT NOT NULL,
  composer_description TEXT NOT NULL,
  empty_title TEXT NOT NULL,
  empty_description TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_wall_settings_kicker CHECK (char_length(btrim(kicker)) BETWEEN 2 AND 80),
  CONSTRAINT community_wall_settings_heading CHECK (char_length(btrim(heading)) BETWEEN 2 AND 100),
  CONSTRAINT community_wall_settings_accent CHECK (char_length(btrim(heading_accent)) BETWEEN 1 AND 60),
  CONSTRAINT community_wall_settings_description CHECK (char_length(btrim(description)) BETWEEN 10 AND 300),
  CONSTRAINT community_wall_settings_collection CHECK (char_length(btrim(collection_label)) BETWEEN 2 AND 60),
  CONSTRAINT community_wall_settings_sign_in_title CHECK (char_length(btrim(sign_in_title)) BETWEEN 2 AND 100),
  CONSTRAINT community_wall_settings_sign_in_description CHECK (char_length(btrim(sign_in_description)) BETWEEN 5 AND 200),
  CONSTRAINT community_wall_settings_composer_title CHECK (char_length(btrim(composer_title)) BETWEEN 2 AND 100),
  CONSTRAINT community_wall_settings_composer_description CHECK (char_length(btrim(composer_description)) BETWEEN 5 AND 200),
  CONSTRAINT community_wall_settings_empty_title CHECK (char_length(btrim(empty_title)) BETWEEN 2 AND 100),
  CONSTRAINT community_wall_settings_empty_description CHECK (char_length(btrim(empty_description)) BETWEEN 5 AND 240),
  CONSTRAINT community_wall_settings_seo_title CHECK (char_length(btrim(seo_title)) BETWEEN 2 AND 100),
  CONSTRAINT community_wall_settings_seo_description CHECK (char_length(btrim(seo_description)) BETWEEN 10 AND 300)
);

ALTER TABLE public.community_wall_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_wall_settings FROM anon, authenticated;

INSERT INTO public.community_wall_settings (
  id, kicker, heading, heading_accent, description, collection_label,
  sign_in_title, sign_in_description, composer_title, composer_description,
  empty_title, empty_description, seo_title, seo_description
) VALUES (
  TRUE,
  'The wall remembers',
  'Words that echo',
  'always.',
  'A collection of notes, hellos, and thoughtful messages left by visitors.',
  'Visitor notes',
  'Join the wall',
  'Continue with GitHub or Google to leave one note on the wall.',
  'Leave your mark',
  'Share one thoughtful note. It appears immediately and can be managed by the site Admin.',
  'The first note is waiting',
  'Visitor messages will appear here.',
  'Community Wall | Leave Your Mark',
  'Read notes from visitors and leave one thoughtful message on Muhammad Haris''s community wall.'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.community_wall_settings
SET
  description = CASE WHEN description = 'A moderated collection of notes, hellos, and thoughtful messages left by visitors.'
    THEN 'A collection of notes, hellos, and thoughtful messages left by visitors.' ELSE description END,
  sign_in_description = CASE WHEN sign_in_description = 'Sign in with GitHub to leave a note for review.'
    THEN 'Continue with GitHub or Google to leave one note on the wall.' ELSE sign_in_description END,
  composer_description = CASE WHEN composer_description = 'Share a thoughtful note. Submissions are reviewed before they appear.'
    THEN 'Share one thoughtful note. It appears immediately and can be managed by the site Admin.' ELSE composer_description END,
  empty_description = CASE WHEN empty_description = 'Approved visitor messages will appear here after moderation.'
    THEN 'Visitor messages will appear here.' ELSE empty_description END,
  seo_description = CASE WHEN seo_description = 'Read moderated notes from visitors and leave a thoughtful message on Muhammad Haris''s community wall.'
    THEN 'Read notes from visitors and leave one thoughtful message on Muhammad Haris''s community wall.' ELSE seo_description END
WHERE id = TRUE;

UPDATE public.community_wall_settings
SET collection_label = 'Visitor notes'
WHERE id = TRUE AND collection_label = 'Community notes';

DROP VIEW IF EXISTS public.public_community_wall_settings;
CREATE VIEW public.public_community_wall_settings
WITH (security_barrier = true)
AS
SELECT kicker, heading, heading_accent, description, collection_label,
  sign_in_title, sign_in_description, composer_title, composer_description,
  empty_title, empty_description, seo_title, seo_description
FROM public.community_wall_settings
WHERE id = TRUE;

REVOKE ALL ON TABLE public.public_community_wall_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.public_community_wall_settings TO anon, authenticated;

DROP TRIGGER IF EXISTS set_community_wall_settings_updated_at
  ON public.community_wall_settings;
CREATE TRIGGER set_community_wall_settings_updated_at
BEFORE UPDATE ON public.community_wall_settings
FOR EACH ROW EXECUTE FUNCTION public.set_community_wall_updated_at();

COMMIT;
