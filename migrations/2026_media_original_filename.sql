-- Apply after backing up the media table. Existing rows cannot reliably recover
-- their original upload names from editable descriptions or Cloudinary public IDs.
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS original_filename text;
