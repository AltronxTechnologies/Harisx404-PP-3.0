BEGIN;

CREATE OR REPLACE FUNCTION public.buildlog_semver_valid(value TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  matched TEXT[];
  identifier TEXT;
BEGIN
  matched := regexp_match(
    btrim(value),
    '^v?([0-9]+)\.([0-9]+)(?:\.([0-9]+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$'
  );
  IF matched IS NULL THEN RETURN FALSE; END IF;
  IF (char_length(matched[1]) > 1 AND left(matched[1], 1) = '0')
     OR (char_length(matched[2]) > 1 AND left(matched[2], 1) = '0')
     OR (matched[3] IS NOT NULL AND char_length(matched[3]) > 1 AND left(matched[3], 1) = '0')
     THEN RETURN FALSE; END IF;

  IF matched[4] IS NOT NULL THEN
    FOREACH identifier IN ARRAY string_to_array(matched[4], '.')
    LOOP
      IF identifier ~ '^[0-9]+$'
         AND char_length(identifier) > 1
         AND left(identifier, 1) = '0'
         THEN RETURN FALSE; END IF;
    END LOOP;
  END IF;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.buildlog_items_valid(value JSONB)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  item JSONB;
  item_count integer;
BEGIN
  IF jsonb_typeof(value) <> 'array' THEN
    RETURN FALSE;
  END IF;
  item_count := jsonb_array_length(value);
  IF item_count < 1 OR item_count > 50 THEN
    RETURN FALSE;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(value)
  LOOP
    IF jsonb_typeof(item) <> 'object' THEN RETURN FALSE; END IF;
    IF jsonb_typeof(item->'title') <> 'string'
       OR char_length(btrim(item->>'title')) NOT BETWEEN 2 AND 160 THEN RETURN FALSE; END IF;
    IF item ? 'description'
       AND item->'description' <> 'null'::jsonb
       AND (
         jsonb_typeof(item->'description') <> 'string'
         OR char_length(btrim(item->>'description')) > 400
        ) THEN RETURN FALSE; END IF;
    IF jsonb_typeof(item->'badge') <> 'string'
       OR char_length(btrim(item->>'badge')) NOT BETWEEN 1 AND 40 THEN RETURN FALSE; END IF;
    IF jsonb_typeof(item->'done') <> 'boolean' THEN RETURN FALSE; END IF;
    IF jsonb_typeof(item->'display_order') <> 'number'
       OR item->>'display_order' !~ '^\d+$'
       OR (item->>'display_order')::numeric > 10000 THEN RETURN FALSE; END IF;
    IF item ? 'id'
       AND item->'id' <> 'null'::jsonb
       AND (
         jsonb_typeof(item->'id') <> 'string'
         OR item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       ) THEN RETURN FALSE; END IF;
    -- Every shipped item requires a semantic version badge.
    IF (item->>'done')::boolean
       AND NOT public.buildlog_semver_valid(item->>'badge')
       THEN RETURN FALSE; END IF;
  END LOOP;

  IF (
    SELECT count(DISTINCT element->>'display_order')
    FROM jsonb_array_elements(value) AS element
  ) <> item_count THEN RETURN FALSE; END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(value) AS element
    WHERE element ? 'id' AND element->'id' <> 'null'::jsonb
    GROUP BY element->>'id'
    HAVING count(*) > 1
  ) THEN RETURN FALSE; END IF;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

DELETE FROM public.buildlog_projects AS project
WHERE jsonb_array_length(project.items) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(project.items) AS element(item)
    WHERE NOT (
      element.item->>'title' IN (
        'Demo: shipped update preview',
        'Demo: planned update preview'
      )
      AND element.item->>'description' =
        'Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.'
      AND element.item->>'badge' = 'preview'
    )
  );

UPDATE public.buildlog_projects AS project
SET items = (
  SELECT jsonb_agg(element.item ORDER BY element.position)
  FROM jsonb_array_elements(project.items) WITH ORDINALITY AS element(item, position)
  WHERE NOT (
    element.item->>'title' IN (
      'Demo: shipped update preview',
      'Demo: planned update preview'
    )
    AND element.item->>'description' =
      'Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.'
    AND element.item->>'badge' = 'preview'
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(project.items) AS element(item)
  WHERE element.item->>'title' IN (
      'Demo: shipped update preview',
      'Demo: planned update preview'
    )
    AND element.item->>'description' =
      'Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.'
    AND element.item->>'badge' = 'preview'
);

ALTER TABLE public.buildlog_projects
  DROP CONSTRAINT IF EXISTS buildlog_items_array,
  DROP CONSTRAINT IF EXISTS buildlog_name_length,
  DROP CONSTRAINT IF EXISTS buildlog_tagline_length,
  DROP CONSTRAINT IF EXISTS buildlog_info_length,
  DROP CONSTRAINT IF EXISTS buildlog_version_length;

ALTER TABLE public.buildlog_projects
  ADD CONSTRAINT buildlog_name_length
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  ADD CONSTRAINT buildlog_tagline_length
    CHECK (char_length(btrim(tagline)) BETWEEN 2 AND 120),
  ADD CONSTRAINT buildlog_info_length
    CHECK (char_length(btrim(info)) BETWEEN 10 AND 360),
  ADD CONSTRAINT buildlog_version_length
    CHECK (char_length(btrim(current_version)) BETWEEN 1 AND 40),
  ADD CONSTRAINT buildlog_items_array CHECK (
    public.buildlog_items_valid(items)
  );

COMMIT;
