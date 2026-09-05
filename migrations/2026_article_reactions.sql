BEGIN;

CREATE TABLE IF NOT EXISTS public.article_reactions (
  id BIGSERIAL PRIMARY KEY,
  article_slug TEXT,
  reaction_type TEXT,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.article_reaction_visitors (
  article_slug TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('like', 'heart', 'celebrate', 'insightful')
  ),
  visitor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_slug, reaction_type, visitor_id)
);

CREATE TABLE IF NOT EXISTS public.article_reaction_rate_limits (
  signal_hash TEXT NOT NULL,
  visitor_id UUID NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (signal_hash, visitor_id, window_started_at)
);

CREATE TABLE IF NOT EXISTS public.article_reaction_signal_rate_limits (
  signal_hash TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (signal_hash, window_started_at)
);

-- Match the mutation function's table access order and hold all migration locks
-- until COMMIT so deduplication and constraint changes cannot race with writes.
LOCK TABLE
  public.article_reaction_signal_rate_limits,
  public.article_reaction_rate_limits,
  public.article_reaction_visitors,
  public.article_reactions
IN SHARE ROW EXCLUSIVE MODE;

DELETE FROM public.article_reactions
WHERE article_slug IS NULL
   OR reaction_type IS NULL
   OR reaction_type NOT IN ('like', 'heart', 'celebrate', 'insightful');

UPDATE public.article_reactions
SET count = GREATEST(COALESCE(count, 0), 0),
    updated_at = COALESCE(updated_at, NOW());

WITH totals AS (
  SELECT MIN(id) AS keep_id, article_slug, reaction_type, SUM(count) AS total
  FROM public.article_reactions
  GROUP BY article_slug, reaction_type
)
UPDATE public.article_reactions AS reaction
SET count = totals.total
FROM totals
WHERE reaction.id = totals.keep_id;

DELETE FROM public.article_reactions AS reaction
USING public.article_reactions AS keeper
WHERE reaction.article_slug = keeper.article_slug
  AND reaction.reaction_type = keeper.reaction_type
  AND reaction.id > keeper.id;

ALTER TABLE public.article_reactions
  ALTER COLUMN article_slug SET NOT NULL,
  ALTER COLUMN reaction_type SET NOT NULL,
  ALTER COLUMN count SET NOT NULL,
  ALTER COLUMN count SET DEFAULT 0,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS article_reactions_slug_type_uidx
  ON public.article_reactions (article_slug, reaction_type);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_reactions_type_check'
      AND conrelid = 'public.article_reactions'::regclass
  ) THEN
    ALTER TABLE public.article_reactions
      ADD CONSTRAINT article_reactions_type_check
      CHECK (reaction_type IN ('like', 'heart', 'celebrate', 'insightful'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_reactions_count_check'
      AND conrelid = 'public.article_reactions'::regclass
  ) THEN
    ALTER TABLE public.article_reactions
      ADD CONSTRAINT article_reactions_count_check CHECK (count >= 0);
  END IF;
END $$;

ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS article_reaction_visitors_article_visitor_idx
  ON public.article_reaction_visitors (article_slug, visitor_id);

ALTER TABLE public.article_reaction_visitors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.article_reaction_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reaction_signal_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS article_reaction_rate_limits_window_idx
  ON public.article_reaction_rate_limits (window_started_at);

CREATE INDEX IF NOT EXISTS article_reaction_signal_rate_limits_window_idx
  ON public.article_reaction_signal_rate_limits (window_started_at);

DELETE FROM public.article_reactions AS reaction
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_posts WHERE slug = reaction.article_slug
);

DELETE FROM public.article_reaction_visitors AS reaction
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_posts WHERE slug = reaction.article_slug
);

ALTER TABLE public.article_reactions
  DROP CONSTRAINT IF EXISTS article_reactions_article_slug_fkey,
  ADD CONSTRAINT article_reactions_article_slug_fkey
  FOREIGN KEY (article_slug) REFERENCES public.blog_posts(slug)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.article_reaction_visitors
  DROP CONSTRAINT IF EXISTS article_reaction_visitors_article_slug_fkey,
  ADD CONSTRAINT article_reaction_visitors_article_slug_fkey
  FOREIGN KEY (article_slug) REFERENCES public.blog_posts(slug)
  ON UPDATE CASCADE ON DELETE CASCADE;

DROP FUNCTION IF EXISTS public.adjust_article_reaction(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.adjust_article_reaction(TEXT, TEXT, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.adjust_article_reaction(TEXT, TEXT, UUID, TEXT, BOOLEAN);

CREATE FUNCTION public.adjust_article_reaction(
  target_slug TEXT,
  target_type TEXT,
  target_visitor UUID,
  target_signal_hash TEXT,
  should_add BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
  changed_rows INTEGER;
  rate_limit_count INTEGER;
  signal_rate_limit_count INTEGER;
  rate_limit_window TIMESTAMPTZ;
BEGIN
  IF target_slug IS NULL OR BTRIM(target_slug) = '' THEN
    RAISE EXCEPTION 'Article slug is required';
  END IF;
  IF target_type NOT IN ('like', 'heart', 'celebrate', 'insightful') THEN
    RAISE EXCEPTION 'Invalid reaction type';
  END IF;
  IF target_visitor IS NULL THEN
    RAISE EXCEPTION 'Visitor ID is required';
  END IF;
  IF target_signal_hash IS NULL OR BTRIM(target_signal_hash) = '' THEN
    RAISE EXCEPTION 'Request signal is required';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.blog_posts
    WHERE slug = target_slug
      AND status = 'published'
      AND published_at <= NOW()
  ) THEN
    RAISE EXCEPTION 'Published article not found';
  END IF;

  rate_limit_window := date_trunc('hour', NOW())
    + FLOOR(EXTRACT(MINUTE FROM NOW()) / 10) * INTERVAL '10 minutes';

  DELETE FROM public.article_reaction_rate_limits
  WHERE window_started_at < NOW() - INTERVAL '2 days';

  DELETE FROM public.article_reaction_signal_rate_limits
  WHERE window_started_at < NOW() - INTERVAL '2 days';

  INSERT INTO public.article_reaction_signal_rate_limits (
    signal_hash,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (target_signal_hash, rate_limit_window, 1, NOW())
  ON CONFLICT (signal_hash, window_started_at)
  DO UPDATE SET
    request_count = public.article_reaction_signal_rate_limits.request_count + 1,
    updated_at = NOW()
  WHERE public.article_reaction_signal_rate_limits.request_count < 300
  RETURNING request_count INTO signal_rate_limit_count;

  IF signal_rate_limit_count IS NULL THEN
    RAISE EXCEPTION 'Reaction rate limit exceeded';
  END IF;

  INSERT INTO public.article_reaction_rate_limits (
    signal_hash,
    visitor_id,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (target_signal_hash, target_visitor, rate_limit_window, 1, NOW())
  ON CONFLICT (signal_hash, visitor_id, window_started_at)
  DO UPDATE SET
    request_count = public.article_reaction_rate_limits.request_count + 1,
    updated_at = NOW()
  WHERE public.article_reaction_rate_limits.request_count < 30
  RETURNING request_count INTO rate_limit_count;

  IF rate_limit_count IS NULL THEN
    RAISE EXCEPTION 'Reaction rate limit exceeded';
  END IF;

  IF should_add THEN
    INSERT INTO public.article_reaction_visitors (
      article_slug,
      reaction_type,
      visitor_id
    )
    VALUES (target_slug, target_type, target_visitor)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS changed_rows = ROW_COUNT;

    IF changed_rows = 0 THEN
      SELECT count INTO updated_count
      FROM public.article_reactions
      WHERE article_slug = target_slug
        AND reaction_type = target_type;
      RETURN COALESCE(updated_count, 0);
    END IF;

    INSERT INTO public.article_reactions (
      article_slug,
      reaction_type,
      count,
      updated_at
    )
    VALUES (target_slug, target_type, 1, NOW())
    ON CONFLICT (article_slug, reaction_type)
    DO UPDATE SET
      count = public.article_reactions.count + 1,
      updated_at = NOW()
    RETURNING count INTO updated_count;
  ELSE
    DELETE FROM public.article_reaction_visitors
    WHERE article_slug = target_slug
      AND reaction_type = target_type
      AND visitor_id = target_visitor;
    GET DIAGNOSTICS changed_rows = ROW_COUNT;

    IF changed_rows = 0 THEN
      SELECT count INTO updated_count
      FROM public.article_reactions
      WHERE article_slug = target_slug
        AND reaction_type = target_type;
      RETURN COALESCE(updated_count, 0);
    END IF;

    UPDATE public.article_reactions
    SET count = GREATEST(count - 1, 0),
        updated_at = NOW()
    WHERE article_slug = target_slug
      AND reaction_type = target_type
    RETURNING count INTO updated_count;

    IF COALESCE(updated_count, 0) = 0 THEN
      DELETE FROM public.article_reactions
      WHERE article_slug = target_slug
        AND reaction_type = target_type;
      updated_count := 0;
    END IF;
  END IF;

  RETURN COALESCE(updated_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_article_reaction(TEXT, TEXT, UUID, TEXT, BOOLEAN)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_article_reaction(TEXT, TEXT, UUID, TEXT, BOOLEAN)
  TO service_role;

COMMENT ON TABLE public.article_reactions IS
  'Aggregate reaction counts for public Blog articles. Writes use server actions.';

COMMENT ON TABLE public.article_reaction_rate_limits IS
  'Persistent ten-minute anonymous reaction mutation counters keyed by request signal and visitor.';

COMMENT ON TABLE public.article_reaction_signal_rate_limits IS
  'Persistent ten-minute reaction abuse ceiling keyed by a salted request signal.';

COMMIT;
