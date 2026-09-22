\set ON_ERROR_STOP on

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (char_length(message) <= 200),
  patternindex integer NOT NULL DEFAULT 0,
  rotation integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  creator_name text NOT NULL DEFAULT 'Anonymous',
  creator_avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO auth.users (id) VALUES ('00000000-0000-4000-8000-000000000002');
INSERT INTO public.messages (message, user_id, creator_name)
VALUES ('Existing production note', '00000000-0000-4000-8000-000000000002', 'Existing Visitor');
INSERT INTO public.messages (message, patternindex, rotation, user_id, creator_name, creator_avatar_url)
VALUES ('   ', -1, 5, '00000000-0000-4000-8000-000000000002', repeat('A', 120), 'http://example.com/avatar.png');

\ir ../migrations/2026_community_wall_messages.sql

DO $$
DECLARE
  status_value text;
  public_count integer;
BEGIN
  SELECT status INTO status_value FROM public.messages WHERE message = 'Existing production note';
  IF status_value IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'existing note was not preserved as published';
  END IF;
  SELECT count(*) INTO public_count FROM public.public_community_wall_messages;
  IF public_count <> 1 THEN RAISE EXCEPTION 'existing note is not visible after upgrade'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.messages
    WHERE message = 'Legacy note unavailable' AND status = 'archived'
      AND patternindex = 4 AND rotation = 3
      AND char_length(creator_name) = 80 AND creator_avatar_url IS NULL
  ) THEN RAISE EXCEPTION 'legacy invalid row was not safely normalized'; END IF;
END;
$$;
