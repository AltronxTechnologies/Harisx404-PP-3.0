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
send the password here. You reported successfully signing in, but the separate
automated browser context still redirects to login; its authenticated geometry
and interaction checks cannot be claimed until it has an owner session. Your
sign-in grants read-only inspection, not permission to save/delete data.
Rotate the Admin password previously shared in chat when practical.

## 2. Approve or decline each locked-scope change

- `/admin/buildlog` currently clips content at 320/390/768px. If you want it
  corrected, explicitly say: "Unlock the Admin Buildlog files for a scoped
  responsive overflow fix; leave the public Buildlog unchanged." Otherwise
  accept and document the limitation. A general request to continue does not
  unlock the entry in `LOCKED_PERFECT.md`.
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
and run the following **read-only** query. Confirm the project/environment
before running anything in the SQL Editor. Report policy names, roles, commands,
and whether any broad `authenticated` write policies remain; you may redact
policy expressions and must omit table rows and secrets.

```sql
select tablename, policyname, permissive, roles, cmd, qual, with_check
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

## 4. Authorize isolated lifecycle tests only when ready

Use a disposable nonproduction Supabase project or explicitly identified
disposable records with a backup and cleanup plan. Specify which operations
you authorize: Settings/About save-and-reopen, FAQ/Blog/Project CRUD, Media
upload/delete, and/or Logs actions. These are distinct approvals, not covered
by read-only login. Confirm who removes fixtures and how public/cache effects
will be checked. Avoid using real portfolio rows as test fixtures.

Decide whether legacy `/admin/about` should remain editable (it does not feed
the locked public About) and whether Admin Changelogs should be retained,
retired, or given a public destination (they are separate from Buildlog).
Do not use either legacy editor to imply a public content change.

## 5. Deployment-only checks

After an approved migration and isolated CRUD pass, the owner must review the
deployed domain, Auth redirect URLs, rotated keys, legal/content rights, and
release rollback plan. `MANUAL_TASKS.md` contains the broader launch playbook;
its older completed-state claims are not a substitute for this Admin acceptance
gate. Local Docker tests and read-only renders do not certify production.
