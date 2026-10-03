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

- **Urgent before deployment:** a disposable signed-in non-owner reached
  validation in the locked Experience Admin write API instead of being denied.
  Source confirms it uses the service-role client after a session-only check.
  No existing record was modified. To let me fix this, explicitly say:
  "Unlock `app/api/admin/experience/route.ts` for a narrow Admin authorization
  fix; do not change the public About/Experience page or other locked Admin
  presentation." I will then rerun anonymous, regular-user and owner tests.
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
- Named locked Admin scopes (Testimonials, Experience, Certifications,
  Community Wall, and qualified Resume work) need their own precise permission
  before any change. No new formal lock is requested; `AUDIT_TESTING.md` runs
  only after you explicitly trigger an audit target.

## 3. Inspect connected policies without changing data

In Supabase Dashboard -> SQL Editor -> New query, select the intended project
and run the following **read-only** queries. Confirm the project/environment
first. Send only the policy names, roles and commands from the first result;
do not send table rows, passwords or keys. A disposable non-owner FAQ INSERT
was denied by RLS, but the exact FAQ/Settings policies still need inspection.

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
DESC)`, but the policy results and column details were not included in your
reply. The assistant did **not** apply
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

Decide whether legacy `/admin/about` should remain editable (it does not feed
the locked public About). You chose to retire the separate Changelog Admin
editor: old Admin links now lead to Buildlog, and `/changelog` still leads to
the public Buildlog. Connected legacy `changelogs` and `changelog_entries`
tables/rows were **not deleted**. If you later want to drop them, first export
and inspect their contents in Supabase, take a backup, and authorize a separate
schema/data cleanup. There is no need to do that to use Buildlog.

## 5. Deployment-only checks

After an approved migration and isolated CRUD pass, the owner must review the
deployed domain, Auth redirect URLs, rotated keys, legal/content rights, and
release rollback plan. `MANUAL_TASKS.md` contains the broader launch playbook;
its older completed-state claims are not a substitute for this Admin acceptance
gate. Local Docker tests and read-only renders do not certify production.

For Admin Analytics Lighthouse scores after deployment:

1. Choose the final public HTTPS domain and verify its home page loads outside
   the sandbox; do not use the Alloy preview URL for PageSpeed.
2. Share only that public URL (not keys). The current Analytics helper targets
   the checked-in origin, so I can check whether its Admin-only target needs a
   change. Public canonical/domain changes remain separately locked.
3. In the deployment host, configure the production site URL and optional
   `PAGESPEED_API_KEY` privately. Do not send the key in chat. Then confirm
   Admin Analytics reports actual mobile/desktop scores rather than dashes.
