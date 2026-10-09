# Admin image upload policy

The Media library, Blog image manager, Media picker and Project editor all call
`app/lib/admin/prepare-image-upload.ts` before posting to the same authenticated
`/api/admin/media/upload` route. There is no visitor image upload path.

- Still JPEG and PNG files are encoded by the browser as WebP at quality 0.94,
  with the longest edge limited to 3840px. The WebP is uploaded only when its
  MIME type is actually `image/webp` and its byte size is smaller than the
  original. This also applies to images below the former 800 KB threshold.
- GIF, WebP, SVG and other image formats are left intact rather than flattening
  animation, rasterizing vector artwork or recompressing efficient AVIF/HEIC.
  PNGs with an APNG animation chunk are also left intact. SVG uploads are
  rejected by the existing Admin upload API; preserving the source here does
  not mean the API accepts it.
- If decoding, canvas or encoding fails, the original is used. The original
  filename is sent separately and validated server-side; converted files keep
  a `.webp` upload name, while `original_filename` retains the source name.
- Existing public Cloudinary/Next Image delivery already uses responsive
  images or format/quality transformations where configured. Upload encoding
  does not replace the public delivery pipeline. No locked public component,
  global CSS, media row schema or dependency was changed for this policy.

**Limits:** Lossy WebP cannot promise pixel identity; inspect critical artwork
before publishing. Already compressed images may stay in their source format.
High-quality 4K files may still exceed a proxy limit; Cloudinary free-tier
storage, bandwidth and transformation quotas depend on account usage. The
previously reported PDF 413 is a separate Resume upload path and is not fixed
by image conversion. Live upload, Cloudinary cleanup, actual gateway limit,
and low-bandwidth delivery tests need an approved disposable target.

Verification: browser-simulated MIME/size/timeout/animation tests in
`tests/prepare-image-upload.test.mjs`, Admin upload metadata tests in
`tests/admin-media-upload.test.mjs`, and a read-only Chromium canvas sample
of an existing 614x614 local PNG: 627432 source bytes vs 68646 WebP bytes at
quality 0.94. This is one sample, not a guarantee for every image.
