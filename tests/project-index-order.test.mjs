import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Projects order is separate from Home and newly created projects lead the collection", async () => {
  const [migration, index, home, admin, manager, route, projectSave] = await Promise.all([
    readFile(new URL("../migrations/2026_project_index_order.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/projects/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectIndexOrderManager.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/order/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_project_admin_atomic_save.sql", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /row_number\(\) OVER \(ORDER BY created_at DESC NULLS LAST, id\)/);
  assert.match(migration, /SET DEFAULT -nextval\('public\.project_index_order_seq'::regclass\)/);
  assert.match(migration, /LOCK TABLE public\.projects IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(migration, /PROJECT_INDEX_CONFLICT/);
  assert.match(migration, /cardinality\(p_ids\) <> \(SELECT count\(\*\) FROM public\.projects WHERE status = 'published'\)/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.set_project_index_order/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.set_project_index_order[\s\S]*TO service_role/);
  assert.match(index, /a\.index_order - b\.index_order/);
  assert.match(index, /return tb - ta \|\| a\.id\.localeCompare\(b\.id\)/);
  assert.match(home, /const featuredDb = dbProjects\.filter\(\(p: any\) => p\.featured\)/);
  assert.match(admin, /<ProjectIndexOrderManager/);
  assert.match(admin, /order\("index_order"\)\.order\("id"\)/);
  assert.match(manager, /projects\.filter\(\(project\) => project\.status === "published"\)/);
  assert.match(manager, /expected: projects\.map\(\(\{ id, updated_at \}\) => \(\{ id, updated_at \}\)\)/);
  assert.match(manager, /useAdminNavigationGuard\(changed \|\| busy\)/);
  assert.ok(route.indexOf("await requireAdmin()") < route.indexOf("createSupabaseAdminClient()"));
  assert.match(route, /db\.rpc\("set_project_index_order"/);
  assert.match(route, /revalidatePath\("\/projects"\)/);
  assert.doesNotMatch(projectSave, /index_order/);
});

test("anonymous visitors cannot reorder published projects", async () => {
  const response = await fetch(`${process.env.PROJECTS_BASE_URL || "http://localhost:3000"}/api/admin/projects/order`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(response.status, 401);
});
