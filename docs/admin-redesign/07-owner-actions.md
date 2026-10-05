# Owner Actions for Admin Acceptance

The assistant can implement and test unlocked code, anonymous access, read-only
owner pages while a session is active, and Docker builds. The owner controls
Supabase dashboard access, production credentials, locked-file permission, and
permission to mutate connected content. Do not paste passwords, service keys,
session cookies, private content, or unredacted SQL results into chat or issues.

## 1. Owner-session visibility

Open `/admin/login` in the shared preview (`http://localhost:8080/admin/login`
through Alloy, or `http://localhost:3000/admin/login` directly) and sign in
yourself. Confirm `/admin`, `/admin/blogs`, and `/admin/analytics` render. Do not
send the password here. You reported successfully signing in. An isolated
in-memory owner test session was used for scoped Buildlog/FAQ checks without
saving credentials or cookies. It does not replace full owner review.
Rotate the Admin password previously shared in chat when practical.

## 2. Approve or decline each locked-scope change

- You explicitly unlocked `app/api/admin/experience/route.ts` for a narrow
  authorization fix. It now checks the verified Admin identity before every
  read/write. Anonymous requests received 401, a disposable non-owner received
  403 for all verbs, owner GET remained 200, and public About remained 200.
  The temporary account was removed; no Experience row or public presentation
  was changed. Other Experience files remain locked.
- You explicitly authorized a scoped Admin Buildlog mobile layout fix. Cards
  now replace the wide table below `xl`, and the public Buildlog is unchanged.
  Authenticated geometry and form controls passed at sampled widths. Other
  locked Buildlog files remain outside this permission.
- You authorized removing the public chrome from Admin while leaving public
  pages alone. Admin-only styles now hide the inherited Navbar, Footer, side
  rails and chat, and the Admin canonical is cleared. The public root remains
  untouched: those components still mount on Admin routes, and its WebSite
  JSON-LD remains in the document. Fully omitting them at render time would
  require a separate explicit change to the locked shared root; do not treat
  the visual isolation as that approval.
- Named locked Admin scopes (Testimonials, remaining Experience work,
  Certifications, Community Wall, and qualified Resume work) need precise permission
  before any change. No new formal lock is requested; `AUDIT_TESTING.md` runs
  only after you explicitly trigger an audit target.
- You explicitly unlocked four Testimonial/Experience Admin form/list files
  for labels and Edit-link names. The seven Testimonial and 14 Experience
  fields now have associated labels, and Edit links announce their row.
  Authenticated checks passed four widths; public Home/About and other locked
  files were not changed. This authorization covered only those four files.

## 3. Inspect connected policies without changing data

You already ran the first read-only policy query and supplied its result:
public SELECT policies for visible FAQs and site settings, plus an INSERT
policy for system logs. You also confirmed the Logs index. A disposable
non-owner FAQ INSERT was denied by RLS. **No migration is needed from this
result alone; do not run either staged Admin migration blindly.** The query
below is retained for future environments. Never send table rows or keys.

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('faqs', 'site_settings', 'system_logs')
order by tablename, policyname;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'system_logs'
  and column_name = 'resolved';

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'system_logs'
  and indexname = 'system_logs_resolved_created_at_idx';
```

The `resolved` column is currently queryable. You confirmed the named
`system_logs_resolved_created_at_idx` index exists on `(resolved, created_at
DESC)` and supplied the policy names/roles/commands; the column's provenance
and effective grants are not fully established. The assistant did **not** apply
`migrations/2026_admin_content_rls_hardening.sql` or
`migrations/2026_admin_system_logs_resolved.sql`. Do not run either migration
just because it exists: first review the catalog results, expected public
SELECT behavior, a backup/rollback plan, and your intended target environment.
If rollout is needed, authorize it separately.

## 4. Scoped lifecycle tests and remaining acceptance

You authorized create/edit/delete testing and said you will replace database
content before deployment. The assistant used uniquely named temporary draft
Buildlog, hidden FAQ, draft Blog and draft Project fixtures for authenticated
Admin API lifecycle checks, then verified all were removed. A disposable draft
Changelog passed create/edit/delete **before its retirement**; it never powered
the public Buildlog. One unique test log was resolved through Admin and removed, without
using bulk clear. Blog/Project stale edit conflicts were rejected. A one-pixel
test image was uploaded through the
Media UI; its database row and Cloudinary asset were also verified removed.
Existing portfolio rows were not modified.
The owner must still review the final Admin UI and approve any changes to
singleton Settings/About values, publication flows or actions against real
logs; these cannot be made disposable merely by deleting a test row. The Media
library now offers upload, copy, and confirmed delete for unused tracked images.
Blog/Project uses are blocked, including managed IDs and matching Cloudinary
URLs, but links hard-coded outside tracked content cannot always be detected.
Deletion across the database and Cloudinary is not atomic; an unexpected
concurrent edit or failed restoration still needs manual review. Use test-only
assets and a backup/restore plan for further workflows.

Before asking for a valid Settings/About save-and-reopen test:

For a **complete** recovery plan, follow `08-backup-restore.md`. One SQL query
cannot save Auth users, Storage file bytes, Cloudinary assets, project settings
and database objects together. Do not restore over the source project for a test.

1. Use a separate development Supabase project with the same schema, or open
   Supabase Dashboard -> Database -> Backups and verify a restore point exists.
2. If backups are unavailable, export the current `site_settings` and
   `about_content` rows privately via the Table Editor before any save. Keep
   that export on your machine; do not send rows or values in chat.
3. Tell me only that the backup or disposable project is ready, and whether to
   keep or retire the legacy About editor. I will then scope a restore-verified
   test rather than changing existing content without a recovery path.

Decide whether legacy `/admin/about` should remain editable (it does not feed
the locked public About). You chose to retire the separate Changelog Admin
editor: old Admin links now lead to Buildlog, and `/changelog` still leads to
the public Buildlog. Connected legacy `changelogs` and `changelog_entries`
tables/rows were **not deleted**. If you later want to drop them, first export
and inspect their contents in Supabase, take a backup, and authorize a separate
schema/data cleanup. There is no need to do that to use Buildlog.

For the Blog Editor/MDX toggle, choose whether the selected mode must persist
per post across browsers. The current connected save RPC does not persist mode
changes; source content remains editable now, and MDX-only syntax is protected
from a lossy visual conversion. A persisted preference requires a reviewed,
atomic Blog RPC migration and isolated rollback testing before application.
Please also review the new unsaved Preview tab in Admin: it shows the public
article hero/body styling, custom MDX, tags, and selected related titles, not
the complete public route with navigation, live reactions, full cards and footer. Confirm whether this editorial
preview is sufficient before treating it as accepted. No existing post was
saved or published during its read-only browser verification.
The new Blog image collection requires a reviewed additive database rollout.
First test `migrations/2026_blog_post_media.sql` and
`tests/blog-post-media.database.test.sql` against an isolated, backed-up copy
of the schema; verify the installed `save_blog_post_with_tags` signature matches
`2026_blog_related_selections.sql`, check service-role permissions and a
rollback, then authorize application to the connected project. The assistant
has **not** applied it or deleted any existing media. Until then the form
reports that the collection is unavailable; existing cover and MDX images
continue to work. A later disposable post/image fixture must verify upload,
save, reuse, detach, Cloudinary deletion and cleanup. Do not use a real Blog
or Project image for that test. Confirm the production domain too: configured
`siteMetadata.siteUrl` previously returned HTTP 404, and generated canonical
URLs must point to a live site before SEO sign-off.
The date-only Admin calendar now schedules a future post at 00:00 UTC and
keeps drafts private. The public Blog index displays UTC dates, but the locked
public article formatter currently uses the visitor's local timezone; a
midnight UTC scheduled post may show the previous calendar day west of UTC.
Changing that locked public formatter requires a separate explicit unlock.
Also review the 20-image/10-tag caps against existing posts before applying
the migration. Unchanged legacy tags/images are preserved when editing; adding
new ones requires meeting the new limits. Only files uploaded into a saved
Blog's dedicated Cloudinary folder are eligible for automatic cleanup on its
permanent deletion. Generic uploads, including uploads during creation of an
unsaved post, and shared assets remain in the Media Library for manual review:
the database cannot prove a generic URL is not hard-coded elsewhere.
For the Projects Admin pass, test
`migrations/2026_project_admin_atomic_delete_with_token.sql` and
`tests/project-atomic-delete.database.test.sql` against an isolated copy of the
full application schema, verify a rollback/backup, then approve application to
the connected project. **The migration has not been applied here.** Until then
Project deletion intentionally returns a setup error instead of proceeding
without an optimistic-lock check. Use only a disposable Project for a later
connected publish/edit/delete acceptance run; shared media files remain in the
library. The locked public Projects index's fallback cards can misrepresent an
all-draft collection. A change to that public page requires a separate,
explicit unlock; this Admin pass did not modify it.
The owner has now unlocked the **Admin Buildlog** list, editor, settings and
related controls for a scoped quality pass; the public `/buildlog` page remains
locked. The existing `2026_buildlog_zzzzz_item_validation.sql` contains
content-matched deletion of historical preview text. Before any replay or
connected rollout, inspect its exact affected rows privately, verify a backup,
and authorize a narrowly identified cleanup or amendment separately. Do not
apply that migration merely to enable the Admin UI. Project and settings
optimistic locking use existing timestamps and require a disposable connected
fixture plus verified cleanup before claiming production acceptance.
Also review the owner's Supabase Auth sessions if available: one temporary
review session created immediately before a missing-browser failure could not
be individually confirmed revoked. Do not share session tokens or revoke all
of your other active sessions without planning to sign in again.

## 5. Deployment-only checks

Before accepting the Admin Resume manager as a live PDF lifecycle, review a
backup or disposable Supabase project and apply the pending
`migrations/2026_resume_document_hardening.sql` there first. Use only a
disposable PDF to test publish, replacement, download bytes, rejection,
deletion and private Storage cleanup. No existing Resume was overwritten or
deleted during the Admin visual pass; its PDF interactions used mocked writes.
The Admin form now sends the PDF directly to private Supabase Storage using a
short-lived signed token to avoid the sandbox upload gateway. Before release,
verify browser-to-Storage CORS and the actual accepted-file flow with only a
disposable PDF; inspect private Storage for unreferenced pending files after a
failed transfer or interrupted finalization. Never remove a pending path that
has become the active Resume. No real PDF transfer was made in this iteration.
The public `/resume` page remains locked.

After an approved migration and isolated CRUD pass, the owner must review the
deployed domain, Auth redirect URLs, rotated keys, legal/content rights, and
release rollback plan. `MANUAL_TASKS.md` contains the broader launch playbook;
its older completed-state claims are not a substitute for this Admin acceptance
gate. Local Docker tests and read-only renders do not certify production.

For Admin Analytics Lighthouse scores after deployment:

1. You confirmed `https://harisx404.vercel.app` as the intended target. It
   currently returned **HTTP 404** from the sandbox, so make its homepage
   publicly reachable with HTTP 200 before requesting live scores. Do not use
   the Alloy preview URL for PageSpeed.
2. The Admin-only Analytics helper targets that exact origin and refuses to
   score a 404 or redirect to another origin. Public canonical/domain changes
   remain separately locked.
3. Deploy the site at that URL and configure `PAGESPEED_API_KEY` privately if
   API quota requires it. Do not send the key
   in chat. After the hourly cache refresh, confirm Admin Analytics reports
   actual mobile/desktop scores and timestamps rather than dashes.
