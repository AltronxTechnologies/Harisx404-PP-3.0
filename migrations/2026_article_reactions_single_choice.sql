BEGIN;

-- Wait for in-flight calls of the old RPC before changing the marker invariant.
LOCK TABLE
  public.article_reaction_signal_rate_limits,
  public.article_reaction_rate_limits,
  public.article_reaction_visitors,
  public.article_reactions
IN SHARE ROW EXCLUSIVE MODE;

-- Keep the newest marker; ties have a fixed preference independent of scan order.
WITH ranked AS (
  SELECT article_slug, reaction_type, visitor_id,
    row_number() OVER (
      PARTITION BY article_slug, visitor_id
      ORDER BY created_at DESC, array_position(
        ARRAY['like', 'heart', 'celebrate', 'insightful'], reaction_type
      )
    ) AS position
  FROM public.article_reaction_visitors
), removed AS (
  DELETE FROM public.article_reaction_visitors AS visitor
  USING ranked
  WHERE visitor.article_slug = ranked.article_slug
    AND visitor.reaction_type = ranked.reaction_type
    AND visitor.visitor_id = ranked.visitor_id
    AND ranked.position > 1
  RETURNING visitor.article_slug, visitor.reaction_type
), reductions AS (
  SELECT article_slug, reaction_type, count(*) AS removed_count
  FROM removed GROUP BY article_slug, reaction_type
)
UPDATE public.article_reactions AS aggregate
SET count = GREATEST(aggregate.count - reductions.removed_count, 0),
    updated_at = now()
FROM reductions
WHERE aggregate.article_slug = reductions.article_slug
  AND aggregate.reaction_type = reductions.reaction_type;

CREATE UNIQUE INDEX IF NOT EXISTS article_reaction_visitors_single_choice_uidx
  ON public.article_reaction_visitors (article_slug, visitor_id);

CREATE OR REPLACE FUNCTION public.toggle_article_reaction(
  target_slug text,
  target_type text,
  target_visitor uuid,
  target_signal_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  previous_type text;
  selected_type text;
  rate_limit_count integer;
  signal_rate_limit_count integer;
  rate_limit_window timestamptz;
  all_counts jsonb;
BEGIN
  IF target_slug IS NULL OR btrim(target_slug) = '' THEN
    RAISE EXCEPTION 'Article slug is required';
  END IF;
  IF target_type IS NULL OR target_type NOT IN ('like', 'heart', 'celebrate', 'insightful') THEN
    RAISE EXCEPTION 'Invalid reaction type';
  END IF;
  IF target_visitor IS NULL THEN
    RAISE EXCEPTION 'Visitor ID is required';
  END IF;
  IF target_signal_hash IS NULL OR btrim(target_signal_hash) = '' THEN
    RAISE EXCEPTION 'Request signal is required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE slug = target_slug AND status = 'published' AND published_at <= now()
  ) THEN
    RAISE EXCEPTION 'Published article not found';
  END IF;

  -- Serialize all choices for this article, including aggregate updates and the snapshot.
  PERFORM pg_advisory_xact_lock(hashtextextended('article-reactions:' || target_slug, 0));

  rate_limit_window := date_trunc('hour', now())
    + floor(extract(minute FROM now()) / 10) * interval '10 minutes';

  DELETE FROM public.article_reaction_rate_limits
  WHERE window_started_at < now() - interval '2 days';
  DELETE FROM public.article_reaction_signal_rate_limits
  WHERE window_started_at < now() - interval '2 days';

  INSERT INTO public.article_reaction_signal_rate_limits (
    signal_hash, window_started_at, request_count, updated_at
  ) VALUES (target_signal_hash, rate_limit_window, 1, now())
  ON CONFLICT (signal_hash, window_started_at)
  DO UPDATE SET request_count = public.article_reaction_signal_rate_limits.request_count + 1,
    updated_at = now()
  WHERE public.article_reaction_signal_rate_limits.request_count < 300
  RETURNING request_count INTO signal_rate_limit_count;
  IF signal_rate_limit_count IS NULL THEN
    RAISE EXCEPTION 'Reaction rate limit exceeded';
  END IF;

  INSERT INTO public.article_reaction_rate_limits (
    signal_hash, visitor_id, window_started_at, request_count, updated_at
  ) VALUES (target_signal_hash, target_visitor, rate_limit_window, 1, now())
  ON CONFLICT (signal_hash, visitor_id, window_started_at)
  DO UPDATE SET request_count = public.article_reaction_rate_limits.request_count + 1,
    updated_at = now()
  WHERE public.article_reaction_rate_limits.request_count < 30
  RETURNING request_count INTO rate_limit_count;
  IF rate_limit_count IS NULL THEN
    RAISE EXCEPTION 'Reaction rate limit exceeded';
  END IF;

  SELECT reaction_type INTO previous_type
  FROM public.article_reaction_visitors
  WHERE article_slug = target_slug AND visitor_id = target_visitor;

  IF previous_type = target_type THEN
    DELETE FROM public.article_reaction_visitors
    WHERE article_slug = target_slug AND visitor_id = target_visitor;
    selected_type := NULL;
  ELSIF previous_type IS NULL THEN
    INSERT INTO public.article_reaction_visitors (article_slug, reaction_type, visitor_id)
    VALUES (target_slug, target_type, target_visitor);
    selected_type := target_type;
  ELSE
    UPDATE public.article_reaction_visitors SET reaction_type = target_type
    WHERE article_slug = target_slug AND visitor_id = target_visitor;
    selected_type := target_type;
  END IF;

  IF previous_type IS NOT NULL THEN
    UPDATE public.article_reactions
    SET count = greatest(count - 1, 0), updated_at = now()
    WHERE article_slug = target_slug AND reaction_type = previous_type;
  END IF;
  IF selected_type IS NOT NULL THEN
    INSERT INTO public.article_reactions (article_slug, reaction_type, count, updated_at)
    VALUES (target_slug, selected_type, 1, now())
    ON CONFLICT (article_slug, reaction_type)
    DO UPDATE SET count = public.article_reactions.count + 1, updated_at = now();
  END IF;

  SELECT jsonb_build_object(
    'like', coalesce(max(count) FILTER (WHERE reaction_type = 'like'), 0),
    'heart', coalesce(max(count) FILTER (WHERE reaction_type = 'heart'), 0),
    'celebrate', coalesce(max(count) FILTER (WHERE reaction_type = 'celebrate'), 0),
    'insightful', coalesce(max(count) FILTER (WHERE reaction_type = 'insightful'), 0)
  ) INTO all_counts
  FROM public.article_reactions WHERE article_slug = target_slug;

  RETURN jsonb_build_object('reaction', selected_type, 'counts', all_counts);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_article_reaction(text, text, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_article_reaction(text, text, uuid, text)
  TO service_role;

-- Older deployed actions pass a pre-read should_add flag. Respect that intent
-- without allowing the old signature to create a second marker or remove a switch.
CREATE OR REPLACE FUNCTION public.adjust_article_reaction(
  target_slug text,
  target_type text,
  target_visitor uuid,
  target_signal_hash text,
  should_add boolean
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  previous_type text;
  result jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('article-reactions:' || target_slug, 0));
  SELECT reaction_type INTO previous_type FROM public.article_reaction_visitors
  WHERE article_slug = target_slug AND visitor_id = target_visitor;
  IF (should_add AND previous_type IS DISTINCT FROM target_type)
     OR (NOT should_add AND previous_type = target_type) THEN
    result := public.toggle_article_reaction(target_slug, target_type, target_visitor, target_signal_hash);
    RETURN (result->'counts'->>target_type)::integer;
  END IF;
  RETURN coalesce((SELECT count FROM public.article_reactions
    WHERE article_slug = target_slug AND reaction_type = target_type), 0);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_article_reaction(text, text, uuid, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_article_reaction(text, text, uuid, text, boolean)
  TO service_role;

COMMIT;
