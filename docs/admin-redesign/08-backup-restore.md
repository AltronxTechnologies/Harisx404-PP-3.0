# Safe Supabase Backup and Restore

There is **no single SQL query** that backs up and recreates a whole Supabase
project. SQL/database exports do not include uploaded Storage file bytes,
Cloudinary images, deployment configuration or secret values. Keep every backup
outside this repository and never send its contents, database URI, tokens or
passwords in chat. Do not drop tables, reset a project or run a restore on the
live source merely to make a backup.

## 1. Choose the recovery method

1. In the source Supabase project, open **Database > Backups**. Note the latest
   available backup or PITR restore point. Supabase daily backups are available
   on paid plans; Free projects should also make regular off-site CLI exports.
2. **Preferred if available:** open **Restore to a New Project**, choose a
   backup, review the new-project cost and restore there, **not over the source**.
   This physical clone copies database schema/data, roles/policies, Auth user
   records and the encryption root key. It does **not** copy Storage files,
   Edge Functions, Auth/OAuth configuration, API keys, Realtime configuration
   or every extension setting.
3. Before cloning, check whether `pg_cron`, `pg_net`, webhooks or wrappers are
   installed: restored jobs may start calling external services immediately.
   If that is unsafe, arrange a reviewed logical restore instead. Do not use a
   restored project for testing until its outbound jobs and credentials are safe.

Official references: [Database backups](https://supabase.com/docs/guides/platform/backups)
and [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project).

## 2. Keep an off-site SQL export as well

On **your private computer**, install the Supabase CLI and Docker. Use a secure
folder outside Git and a private offline/encrypted backup destination. Get the
source project's **session-pooler** database URI from its Dashboard **Connect**
button. It contains a database password; never commit it, paste it here, or put
it directly into a shell-history command. If you cannot retrieve that password,
do not reset a live database password until you have planned the app connection
update.

From your private backup folder, enter the URI through a hidden prompt and
run Supabase's documented exports:

```bash
umask 077
read -r -s -p 'Source database URI: ' SOURCE_DB_URI
printf '\n'
supabase db dump --db-url "$SOURCE_DB_URI" -f roles.sql --role-only
supabase db dump --db-url "$SOURCE_DB_URI" -f schema.sql
supabase db dump --db-url "$SOURCE_DB_URI" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
unset SOURCE_DB_URI
```

Check that **all three commands succeeded** and that the files are nonempty;
retain them privately. These exports are sensitive: they may include personal
information and password hashes. The default schema dump omits managed
schemas such as `auth` and `storage`; **do not claim these files alone are a
complete Auth or Storage recovery**. If Auth users, managed-schema triggers,
Storage metadata, Vault or custom roles matter, verify their restoration with
the official guide in a separate project. A raw `pg_dump` archive may be useful
as another off-site snapshot, but its roles and project configuration are
separate, and blindly restoring managed schemas into a fresh Supabase project
can conflict with platform-owned objects.

Official references: [Supabase CLI backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
and [CLI dump reference](https://supabase.com/docs/reference/cli/supabase-db-dump).
The checked-in `supabase_schema.sql` and individual `migrations/` are **not** a
snapshot of current connected rows or settings; do not use them as the only
recovery material.

## 3. Back up files and settings separately

1. In Supabase **Storage**, inventory every bucket, its public/private status,
   size/type rules and object paths. Download **the actual file bytes** using
   the Storage API or S3-compatible interface to private off-site storage.
   A database backup only preserves Storage metadata, not deleted object bytes.
   In this app, verify the active Resume PDF as well as any other bucket files.
2. Cloudinary is **outside Supabase**. Preserve the original uploaded images
   and their `public_id`/URL relationships using your Cloudinary account's
   export/download/backup facilities. The `media` database table alone cannot
   recreate image bytes. If you move Cloudinary accounts, old public URLs may
   change and need a reviewed mapping.
3. Keep a private inventory of Auth redirect URLs, OAuth providers, SMTP,
   Storage policies/buckets, Realtime publications, Database Webhooks, Edge
   Functions/dependencies, cron jobs, enabled extensions, deployment environment
   variable **names**, domains/DNS and third-party integrations. Store the
   secret values only in a password manager or secure secret store, not in the
   SQL exports or this repo. Function downloads may omit `deno.json`/import
   maps; keep function source and dependency configuration separately.

Official references: [Storage migration](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore#migrating-storage-objects),
[Storage S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility),
and [Edge Function migration](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore#migrating-edge-functions).

## 4. Prove recovery before relying on it

1. Restore into a **separate, empty test project**. With a paid-plan physical
   clone, complete missing Storage objects and project settings there. For a
   manual logical restore, follow the [official Supabase procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore#restore-backup-using-cli):
   create a new project, enable necessary extensions/webhooks, obtain **its own**
   URI, and restore roles, schema, then data with `psql` in the documented order.
   **Double-check the URI points to the NEW project, not the source.** For a
   reviewed logical restore with no Vault/column encryption, the official
   command is:

   ```bash
   read -r -s -p 'NEW test project database URI: ' TARGET_DB_URI
   printf '\n'
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql --dbname "$TARGET_DB_URI"
   unset TARGET_DB_URI
   ```

   Stop on any error and follow the official guide's role/schema troubleshooting
   instead of rerunning blindly against a populated project. Do not paste
   `data.sql` into the source project's SQL Editor. Vault/pgsodium
   encrypted data requires special root-key handling before the source is
   paused or deleted; the logical SQL files do not contain that key.
2. Compare table counts in the source and test projects without sharing row
   contents. Confirm Auth sign-in, Admin authorization/RLS, trigger/function
   behavior, a Blog and Project read, `/resume/file`, Storage downloads,
   Cloudinary image URLs and any Edge Functions that matter.
3. Verify the backup can be restored and that **no objects are missing** before
   making a production migration or deleting the source project. Supabase
   Dashboard restore **over the existing project** causes downtime and may
   roll data back to the selected point; do not do it for this Admin test.

For the immediate Settings/About save-and-reopen check, a verified separate
development project is best. Otherwise retain a private backup/export of the
existing `site_settings` and `about_content` rows plus a restore plan, and
confirm when it is ready **without sending the values here**. That limited
backup does not replace the full project plan above.
