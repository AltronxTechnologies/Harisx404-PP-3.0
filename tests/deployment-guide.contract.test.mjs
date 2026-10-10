import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deployment guide names the application's required Supabase keys and recovery gates", async () => {
  const [guide, example, safeClient] = await Promise.all([
    readFile(new URL("../docs/12_DEPLOYMENT_GUIDE.md", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabase/safe.ts", import.meta.url), "utf8"),
  ]);
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAIL"]) {
    assert.ok(guide.includes(key), `deployment guide documents ${key}`);
    assert.ok(example.includes(key), `env example documents ${key}`);
  }
  assert.match(safeClient, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(guide, /NEXT_PUBLIC_SUPABASE_ANON=/);
  assert.match(guide, /08-backup-restore\.md/);
  assert.match(guide, /HTTP 413/);
});
