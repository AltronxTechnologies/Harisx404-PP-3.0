-- Apply separately after backup review; do not replay the historical wall migration.
BEGIN;

ALTER TABLE public.messages ALTER COLUMN status SET DEFAULT 'pending';

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
    p_creator_avatar_url, 'pending', NULL
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

COMMIT;
