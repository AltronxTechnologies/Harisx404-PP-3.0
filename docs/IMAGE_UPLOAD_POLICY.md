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

## Reported sub-1 MB WebP HTTP 413: decision and safe path

The exact observed Admin wording comes from `app/lib/admin/read-admin-response.ts`
when a response to `/api/admin/media/upload` has HTTP 413 and is **not JSON**.
The route's own file-size check is 20 MiB and returns JSON with different copy.
That distinguishes the response shape; it does not prove which external hop
rejected the body. A WebP is returned untouched at
`app/lib/admin/prepare-image-upload.ts:41-44`; the canvas fallback only applies
to JPEG/PNG. Do not downscale an already-small WebP or impose a guessed 900 KB
ceiling as a purported repair for this report.

Both the direct Next origin (3000) and Alloy proxy (8080) returned JSON 401 to
invalid, anonymous multipart requests carrying 0.5, 0.9, 1.3 and 2.5 MB of
data; a browser-side probe through 8080 returned the same result. These are
non-writing ingress probes, **not** proof of authenticated upload success.
The reported failing URL, request-body bytes, response content type and
rejecting gateway have not been captured. This repository has no Nginx
configuration. [Vercel documents a 4.5 MB function request-body limit](https://vercel.com/docs/functions/limitations#request-body-size):
if Vercel is the confirmed target, the app's advertised 20 MiB media limit
would require a separate transport for larger assets. That limit by itself
does not explain a genuinely sub-1 MB request. See
`docs/PRODUCTION_READY_PAGES.md#image-upload-follow-up` for the redacted trace
needed to identify the actual boundary.

**No direct-upload replacement is implemented or verified yet.** A professional
signed browser-to-Cloudinary flow needs more than a signature endpoint:

1. Review a data-preserving migration for a private, owner-bound upload-intent
   record with an unpredictable ID, server-selected public ID/folder, expiry,
   consumed state and unique constraints. Verify and restore this on a
   separate disposable database before any connected change.
2. Issue only tightly scoped signed parameters after fresh Admin authorization.
   Never expose the API secret, sign arbitrary client parameters, reuse a public
   ID with overwrite enabled, or assume a signature binds the uploaded bytes.
3. POST file bytes from the browser directly to Cloudinary using its documented
   signed endpoint. Preserve original filenames, format/animation behavior,
   Project Save timing, Blog scope and existing 20 MiB validations. Check real
   account limits and CORS on an approved test account; Cloudinary limits vary
   by plan and cannot be promised as unlimited.
4. After another Admin check, verify the exact Cloudinary asset and upload
   intent server-side. Atomically consume the intent and insert one Media row;
   retries must return the existing result, not create duplicate or attach a
   different asset. Use authoritative metadata rather than trusting browser
   URLs/dimensions. Keep guarded deletion and explicit uncertain-result UI.
5. Reconcile orphaned Cloudinary assets after interrupted or expired uploads,
   allowing for signed-request validity and concurrent finalization. Never
   delete a committed/shared asset based only on a client-supplied public ID.
   Exercise forged/replayed/expired signatures, race/rollback, missing CORS,
   Cloudinary error and Project/Blog/Media/Picker success/failure paths on a
   restore-tested disposable target before enabling this architecture.

Until the rejecting layer is identified or that complete lifecycle is reviewed
and verified, changing Next.js image-delivery config, the route's 20 MiB limit,
or a client compression fallback would be an unverified workaround, not a
confirmed fix. The current upload release gate remains **BLOCKED**.
