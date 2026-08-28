-- Experience → LinkedIn-parity schema upgrade (2026)
-- Adds structured position fields matching LinkedIn's "Add position" form:
-- job title (existing `role`), organization (existing `company`), logo,
-- location + location type, employment type, month-granular dates with an
-- "I currently work here" flag, summary, and rich highlights.
-- Legacy columns (start_date, end_date, bullets, tech) are kept so existing
-- rows continue to render.

ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS location_type text; -- On-site | Hybrid | Remote
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS employment_type text; -- Full-time | Part-time | Self-employed | Freelance | Contract | Internship | Apprenticeship | Seasonal | Open source
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS start_month int; -- 1-12
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS start_year int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS end_month int; -- 1-12
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS end_year int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS summary text;
-- highlights: jsonb array of { "lead": "Bold lead-in:", "text": "Sentence. [Link label](https://url) supported." }
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb;
