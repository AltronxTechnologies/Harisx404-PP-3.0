import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("featured selection is owner-guarded and ordered atomically", async () => {
  const [route, migration, home, list, form] = await Promise.all([
    readFile(new URL("../app/api/admin/projects/featured/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_project_featured_order.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/projects/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
  ]);
  assert.ok(route.indexOf("await requireAdmin()") < route.indexOf("createSupabaseAdminClient()"));
  assert.match(route, /db\.rpc\("set_home_featured_projects"/);
  assert.match(migration, /LOCK TABLE public\.projects IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(migration, /FEATURED_PROJECT_CONFLICT/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.set_home_featured_projects/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.set_home_featured_projects[\s\S]*TO service_role/);
  assert.match(home, /const homeDb = featuredDb\.map/);
  assert.doesNotMatch(home, /featuredDb\.length > 0 \? 6 : 3/);
  assert.doesNotMatch(list, /Timeline|start_date|end_date/);
  assert.doesNotMatch(form, /id="project-start-date"|id="project-end-date"|register\("featured"\)/);
  assert.match(form, /featured: initialData\?\.featured === true/);
});

test("anonymous visitors cannot change the Home selection", async () => {
  const response = await fetch(`${process.env.PROJECTS_BASE_URL || "http://localhost:3000"}/api/admin/projects/featured`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(response.status, 401);
});
