\set ON_ERROR_STOP on
-- Run ONLY against a disposable PostgreSQL database, never connected Supabase.
-- Bootstrap the minimal Blog dependency and apply both migrations before tests.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END;
$$;
CREATE TABLE public.blog_posts (
  slug text PRIMARY KEY,
  status text NOT NULL,
  published_at timestamptz
);
INSERT INTO public.blog_posts VALUES
  ('reaction-live', 'published', now() - interval '1 day'),
  ('reaction-draft', 'draft', NULL),
  ('reaction-future', 'published', now() + interval '1 day');
\ir ../migrations/2026_article_reactions.sql

INSERT INTO public.article_reaction_visitors (article_slug, reaction_type, visitor_id, created_at) VALUES
  ('reaction-live', 'like', '00000000-0000-4000-8000-000000000001', now() - interval '1 day'),
  ('reaction-live', 'heart', '00000000-0000-4000-8000-000000000001', now()),
  ('reaction-live', 'celebrate', '00000000-0000-4000-8000-000000000002', now()),
  ('reaction-live', 'insightful', '00000000-0000-4000-8000-000000000002', now());
INSERT INTO public.article_reactions (article_slug, reaction_type, count) VALUES
  ('reaction-live', 'like', 8), ('reaction-live', 'heart', 3),
  ('reaction-live', 'celebrate', 1), ('reaction-live', 'insightful', 0);
\ir ../migrations/2026_article_reactions_single_choice.sql
\ir ../migrations/2026_article_reactions_single_choice.sql

BEGIN;
DO $$
DECLARE
  visitor uuid := '00000000-0000-4000-8000-000000000001';
  second_visitor uuid := '00000000-0000-4000-8000-000000000002';
  result jsonb;
BEGIN
  IF (SELECT reaction_type FROM public.article_reaction_visitors
      WHERE article_slug = 'reaction-live' AND visitor_id = visitor) <> 'heart'
     OR (SELECT reaction_type FROM public.article_reaction_visitors
      WHERE article_slug = 'reaction-live' AND visitor_id = second_visitor) <> 'celebrate'
     OR (SELECT count FROM public.article_reactions WHERE article_slug = 'reaction-live' AND reaction_type = 'like') <> 7
     OR (SELECT count FROM public.article_reactions WHERE article_slug = 'reaction-live' AND reaction_type = 'insightful') <> 0 THEN
    RAISE EXCEPTION 'Deduplication or conservative aggregate adjustment failed';
  END IF;
  IF has_function_privilege('anon', 'public.toggle_article_reaction(text,text,uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.toggle_article_reaction(text,text,uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.toggle_article_reaction(text,text,uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.adjust_article_reaction(text,text,uuid,text,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC grants changed';
  END IF;
  BEGIN
    INSERT INTO public.article_reaction_visitors (article_slug, reaction_type, visitor_id)
    VALUES ('reaction-live', 'like', visitor);
    RAISE EXCEPTION 'Single-choice uniqueness not enforced';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  result := public.toggle_article_reaction('reaction-live', 'like', visitor, 'test-signal');
  IF result <> '{"reaction":"like","counts":{"like":8,"heart":2,"celebrate":1,"insightful":0}}'::jsonb THEN
    RAISE EXCEPTION 'Switch did not return all authoritative counts: %', result;
  END IF;
  result := public.toggle_article_reaction('reaction-live', 'like', visitor, 'test-signal');
  IF result <> '{"reaction":null,"counts":{"like":7,"heart":2,"celebrate":1,"insightful":0}}'::jsonb THEN
    RAISE EXCEPTION 'Same-type removal failed: %', result;
  END IF;
  result := public.toggle_article_reaction('reaction-live', 'insightful', visitor, 'test-signal');
  IF result->>'reaction' <> 'insightful' OR (result->'counts'->>'insightful')::integer <> 1 THEN
    RAISE EXCEPTION 'Adding a reaction failed: %', result;
  END IF;
  IF public.adjust_article_reaction('reaction-live', 'heart', visitor, 'test-signal', false) <> 2
     OR (SELECT reaction_type FROM public.article_reaction_visitors
         WHERE article_slug = 'reaction-live' AND visitor_id = visitor) <> 'insightful' THEN
    RAISE EXCEPTION 'Old RPC removed a switched choice';
  END IF;
  IF public.adjust_article_reaction('reaction-live', 'heart', visitor, 'test-signal', true) <> 3 THEN
    RAISE EXCEPTION 'Old RPC failed to switch instead of creating a second choice';
  END IF;
  IF (SELECT count(*) FROM public.article_reaction_visitors
      WHERE article_slug = 'reaction-live' AND visitor_id = visitor) <> 1 THEN
    RAISE EXCEPTION 'Multiple markers after legacy RPC';
  END IF;

  BEGIN
    PERFORM public.toggle_article_reaction('reaction-draft', 'like', visitor, 'test-signal');
    RAISE EXCEPTION 'Draft was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Published article not found' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.toggle_article_reaction('reaction-future', 'like', visitor, 'test-signal');
    RAISE EXCEPTION 'Scheduled article was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Published article not found' THEN RAISE; END IF;
  END;

  UPDATE public.article_reaction_rate_limits SET request_count = 30
  WHERE signal_hash = 'test-signal' AND visitor_id = visitor;
  BEGIN
    PERFORM public.toggle_article_reaction('reaction-live', 'heart', visitor, 'test-signal');
    RAISE EXCEPTION 'Rate limit was bypassed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Reaction rate limit exceeded' THEN RAISE; END IF;
  END;
  IF (SELECT reaction_type FROM public.article_reaction_visitors
      WHERE article_slug = 'reaction-live' AND visitor_id = visitor) <> 'heart' THEN
    RAISE EXCEPTION 'Rate-limited call mutated the reaction';
  END IF;
  UPDATE public.article_reaction_rate_limits SET request_count = 1
  WHERE signal_hash = 'test-signal' AND visitor_id = visitor;
  UPDATE public.article_reaction_signal_rate_limits SET request_count = 300
  WHERE signal_hash = 'test-signal';
  BEGIN
    PERFORM public.toggle_article_reaction('reaction-live', 'like', second_visitor, 'test-signal');
    RAISE EXCEPTION 'Signal ceiling was bypassed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Reaction rate limit exceeded' THEN RAISE; END IF;
  END;
  IF (SELECT reaction_type FROM public.article_reaction_visitors
      WHERE article_slug = 'reaction-live' AND visitor_id = second_visitor) <> 'celebrate' THEN
    RAISE EXCEPTION 'Signal-limited call mutated another visitor';
  END IF;
END;
$$;
ROLLBACK;
