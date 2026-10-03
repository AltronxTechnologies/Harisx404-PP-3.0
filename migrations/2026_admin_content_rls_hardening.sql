-- Apply after 2026_faqs.sql, which grants all authenticated users FAQ CRUD and
-- site_settings UPDATE. The public visible-FAQ and site-settings SELECT policies
-- remain unchanged. Verified Admin server routes use the service role for writes.
DROP POLICY IF EXISTS "Authenticated users manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Authenticated users update site settings" ON public.site_settings;
