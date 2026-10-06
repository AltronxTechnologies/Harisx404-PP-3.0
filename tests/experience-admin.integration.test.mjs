import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Experience Admin uses verified service-role reads and strict writes", async () => {
  const [api, list, edit, form, deletion] = await Promise.all([
    source("app/api/admin/experience/route.ts"),
    source("app/admin/(dashboard)/experience/page.tsx"),
    source("app/admin/(dashboard)/experience/[id]/page.tsx"),
    source("app/components/admin/ExperienceForm.tsx"),
    source("app/components/admin/DeleteExperienceButton.tsx"),
  ]);
  assert.equal((api.match(/await requireAdmin\(\)/g) || []).length, 4);
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const section = api.slice(api.indexOf(`export async function ${method}(`));
    assert.ok(section.indexOf("if (auth.response) return auth.response") < section.indexOf("createSupabaseAdminClient()"), `${method} authorizes before service role`);
    const response = await fetch(`${base}/api/admin/experience`, { method });
    assert.equal(response.status, 401, `${method} denies anonymous callers`);
  }
  assert.match(api, /\.strict\(\)/);
  assert.match(api, /\.eq\("id", id\)\.select\("id"\)\.maybeSingle\(\)/);
  assert.doesNotMatch(api, /stripOptionalColumns|isMissingColumnError/);
  assert.ok(list.indexOf("requireAdmin()") < list.indexOf("createSupabaseAdminClient()"));
  assert.ok(edit.indexOf("requireAdmin()") < edit.indexOf("createSupabaseAdminClient()"));
  assert.match(list, /count: "exact", head: true/);
  assert.match(list, /grid min-w-0 gap-3 xl:hidden/);
  assert.match(list, /Experience entries could not be loaded/);
  assert.match(edit, /Experience entry could not be loaded/);
  assert.match(form, /setValueAs: \(value: string\) => value === "" \? NaN : Number\(value\)/);
  assert.match(form, /<BuildlogSelect id="experience-status"/);
  assert.match(form, /data\.logo_url === initialData\?\.logo_url \? \{\} : \{ logo_url:/);
  assert.match(form, /Discard unsaved Experience changes/);
  assert.match(deletion, /confirmText="DELETE"/);
});
