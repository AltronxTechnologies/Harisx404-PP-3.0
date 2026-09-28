-- Apply after the project gallery-alt, stage, related selections, case study, and redesign migrations.
-- Called only by the service-role client after the admin session is authorized.
BEGIN;

UPDATE public.projects
SET updated_at = COALESCE(created_at, clock_timestamp())
WHERE updated_at IS NULL;
ALTER TABLE public.projects ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.advance_project_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := GREATEST(clock_timestamp(), OLD.updated_at + interval '1 microsecond');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS advance_project_updated_at ON public.projects;
CREATE TRIGGER advance_project_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.advance_project_updated_at();

CREATE OR REPLACE FUNCTION public.save_project_with_gallery_and_tags(
  p_project jsonb,
  p_gallery jsonb,
  p_tags jsonb,
  p_id uuid DEFAULT NULL,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  saved_project public.projects%ROWTYPE;
  previous_slug text;
  related_ids uuid[];
  related_id uuid;
  related_count integer := 0;
  gallery_item jsonb;
  gallery_index integer := 0;
  tag_item jsonb;
  tag_name text;
  tag_slug text;
  base_tag_slug text;
  tag_attempt integer;
  saved_tag_id uuid;
BEGIN
  related_ids := ARRAY(SELECT jsonb_array_elements_text(p_project->'related_project_ids')::uuid);
  IF cardinality(related_ids) > 2 OR
     (p_id IS NOT NULL AND p_id = ANY(related_ids)) OR
     (SELECT count(DISTINCT id) FROM unnest(related_ids) AS ids(id)) <> cardinality(related_ids) THEN
    RAISE EXCEPTION 'Choose two different related projects, excluding this project';
  END IF;

  -- Lock selected rows so they cannot become unpublished before the write commits.
  FOR related_id IN
    SELECT id FROM public.projects
    WHERE id = ANY(related_ids) AND status = 'published'
    ORDER BY id FOR SHARE
  LOOP
    related_count := related_count + 1;
  END LOOP;
  IF related_count <> cardinality(related_ids) THEN
    RAISE EXCEPTION 'Choose only published projects that still exist';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.projects (
      title, slug, description, content, status, cover_image_url, cover_image_id,
      live_url, github_url, start_date, end_date, featured, tagline, category,
      year, latest_update_label, project_stage, expected_completion_label,
      source_note, case_study_sections, tech_stack, features, related_project_ids
    ) VALUES (
      p_project->>'title', p_project->>'slug', p_project->>'description',
      p_project->>'content', p_project->>'status', p_project->>'cover_image_url',
      NULLIF(p_project->>'cover_image_id', '')::uuid, p_project->>'live_url',
      p_project->>'github_url', NULLIF(p_project->>'start_date', '')::date,
      NULLIF(p_project->>'end_date', '')::date, (p_project->>'featured')::boolean,
      p_project->>'tagline', p_project->>'category', p_project->>'year',
      p_project->>'latest_update_label', p_project->>'project_stage',
      p_project->>'expected_completion_label', p_project->>'source_note',
      p_project->'case_study_sections',
      ARRAY(SELECT jsonb_array_elements_text(p_project->'tech_stack')),
      ARRAY(SELECT jsonb_array_elements_text(p_project->'features')), related_ids
    ) RETURNING * INTO saved_project;
  ELSE
    SELECT * INTO saved_project FROM public.projects WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROJECT_NOT_FOUND';
    END IF;
    IF p_expected_updated_at IS NULL OR saved_project.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'PROJECT_CONFLICT: project has changed';
    END IF;
    previous_slug := saved_project.slug;

    UPDATE public.projects SET
      title = p_project->>'title',
      slug = p_project->>'slug',
      description = p_project->>'description',
      content = p_project->>'content',
      status = p_project->>'status',
      cover_image_url = p_project->>'cover_image_url',
      cover_image_id = NULLIF(p_project->>'cover_image_id', '')::uuid,
      live_url = p_project->>'live_url',
      github_url = p_project->>'github_url',
      start_date = NULLIF(p_project->>'start_date', '')::date,
      end_date = NULLIF(p_project->>'end_date', '')::date,
      featured = (p_project->>'featured')::boolean,
      tagline = p_project->>'tagline',
      category = p_project->>'category',
      year = p_project->>'year',
      latest_update_label = p_project->>'latest_update_label',
      project_stage = p_project->>'project_stage',
      expected_completion_label = p_project->>'expected_completion_label',
      source_note = p_project->>'source_note',
      case_study_sections = p_project->'case_study_sections',
      tech_stack = ARRAY(SELECT jsonb_array_elements_text(p_project->'tech_stack')),
      features = ARRAY(SELECT jsonb_array_elements_text(p_project->'features')),
      related_project_ids = related_ids
    WHERE id = p_id RETURNING * INTO saved_project;
  END IF;

  DELETE FROM public.project_images WHERE project_id = saved_project.id;
  FOR gallery_item IN SELECT value FROM jsonb_array_elements(p_gallery)
  LOOP
    IF EXISTS (SELECT 1 FROM public.project_images
               WHERE project_id = saved_project.id AND media_id = (gallery_item->>'mediaId')::uuid) THEN
      RAISE EXCEPTION 'Gallery images must be unique';
    END IF;
    INSERT INTO public.project_images (project_id, media_id, caption, alt_text, display_order)
    VALUES (saved_project.id, (gallery_item->>'mediaId')::uuid, gallery_item->>'caption', gallery_item->>'altText', gallery_index);
    gallery_index := gallery_index + 1;
  END LOOP;

  DELETE FROM public.project_tags WHERE project_id = saved_project.id;
  FOR tag_item IN SELECT value FROM jsonb_array_elements(p_tags)
  LOOP
    tag_name := btrim(tag_item #>> '{}');
    IF tag_name = '' THEN
      RAISE EXCEPTION 'Tag must contain a name';
    END IF;

    base_tag_slug := regexp_replace(regexp_replace(lower(tag_name), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g');
    IF base_tag_slug = '' THEN
      base_tag_slug := 'tag-' || md5(tag_name);
    END IF;

    -- Unique names own distinct tags, even when their normalized slugs collide.
    SELECT id INTO saved_tag_id FROM public.tags WHERE name = tag_name;
    IF NOT FOUND THEN
      tag_attempt := 0;
      LOOP
        tag_slug := CASE tag_attempt
          WHEN 0 THEN base_tag_slug
          WHEN 1 THEN base_tag_slug || '-' || md5(tag_name)
          ELSE base_tag_slug || '-' || md5(tag_name) || '-' || tag_attempt::text
        END;
        INSERT INTO public.tags (name, slug) VALUES (tag_name, tag_slug)
        ON CONFLICT DO NOTHING RETURNING id INTO saved_tag_id;
        IF saved_tag_id IS NOT NULL THEN EXIT; END IF;
        -- ON CONFLICT waits for concurrent inserts; the next statement sees their committed name.
        SELECT id INTO saved_tag_id FROM public.tags WHERE name = tag_name;
        IF saved_tag_id IS NOT NULL THEN EXIT; END IF;
        tag_attempt := tag_attempt + 1;
      END LOOP;
    END IF;
    INSERT INTO public.project_tags (project_id, tag_id) VALUES (saved_project.id, saved_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object('project', to_jsonb(saved_project), 'old_slug', previous_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.save_project_with_gallery_and_tags(jsonb, jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_project_with_gallery_and_tags(jsonb, jsonb, jsonb, uuid, timestamptz)
  TO service_role;

CREATE OR REPLACE FUNCTION public.delete_project_and_unlink_related(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  deleted_slug text;
  referring_project record;
  referring_slugs text[] := ARRAY[]::text[];
BEGIN
  SELECT slug INTO deleted_slug FROM public.projects WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND';
  END IF;

  FOR referring_project IN
    SELECT id, slug FROM public.projects
    WHERE p_id = ANY(related_project_ids)
    ORDER BY id FOR UPDATE
  LOOP
    UPDATE public.projects SET related_project_ids = array_remove(related_project_ids, p_id)
    WHERE id = referring_project.id;
    referring_slugs := array_append(referring_slugs, referring_project.slug);
  END LOOP;

  DELETE FROM public.projects WHERE id = p_id;
  RETURN jsonb_build_object('slug', deleted_slug, 'referring_slugs', referring_slugs);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_project_and_unlink_related(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project_and_unlink_related(uuid)
  TO service_role;

COMMIT;
