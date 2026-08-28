-- =============================================
-- TESTIMONIAL PUBLIC SUBMISSIONS (moderation flow)
-- Run this in the Supabase SQL editor.
-- =============================================
--
-- Adds support for visitor-submitted testimonials:
--   * status 'pending'  — new public submissions land here (invisible on the
--     site: the public SELECT policy only exposes status = 'published').
--   * email             — optional, private contact for verifying authenticity.
--     NEVER rendered publicly; only visible in the admin panel.
--   * source            — 'admin' (created in the panel) or 'public'
--     (visitor-submitted), so the admin queue can flag provenance.
--
-- Inserts from the public form are performed server-side with the service
-- role key (bypasses RLS) after validation + rate limiting, so no anon
-- INSERT policy is needed and the anon key can never write to this table.

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin';

-- Keep status values honest going forward.
DO $$
BEGIN
  ALTER TABLE public.testimonials
    ADD CONSTRAINT testimonials_status_check
    CHECK (status IN ('pending', 'draft', 'published', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Helpful index for the admin moderation queue.
CREATE INDEX IF NOT EXISTS testimonials_status_created_idx
  ON public.testimonials (status, created_at DESC);
