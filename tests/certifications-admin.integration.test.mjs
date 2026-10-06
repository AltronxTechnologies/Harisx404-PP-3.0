import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Certification Admin verifies owner before reads/writes and fails closed for invalid requests", async () => {
  const api = await source("app/api/admin/certifications/route.ts");
  assert.equal((api.match(/await requireAdmin\(\)/g) || []).length, 4);
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const handler = api.slice(api.indexOf(`export async function ${method}(`));
    assert.ok(handler.indexOf("if (auth.response) return auth.response") < handler.indexOf("createSupabaseAdminClient()"), `${method} must authorize before service role`);
    const response = await fetch(`${base}/api/admin/certifications`, { method });
    assert.equal(response.status, 401, `${method} must reject anonymous callers`);
  }
  assert.match(api, /\}\)\.strict\(\)\.superRefine/);
  assert.match(api, /Certification not found\. Refresh the list/);
  assert.match(api, /Cache-Control": "private, no-store"/);
  assert.match(api, /public Credentials cache refresh could not be confirmed/);
});

test("Certification Admin keeps cards, edit states and safe confirmations", async () => {
  const [list, edit, form, deletion] = await Promise.all([
    source("app/admin/(dashboard)/certifications/page.tsx"),
    source("app/admin/(dashboard)/certifications/[id]/page.tsx"),
    source("app/components/admin/CertificationForm.tsx"),
    source("app/components/admin/DeleteCertificationButton.tsx"),
  ]);
  assert.ok(list.indexOf("requireAdmin()") < list.indexOf("createSupabaseAdminClient()"));
  assert.ok(edit.indexOf("requireAdmin()") < edit.indexOf("createSupabaseAdminClient()"));
  assert.match(list, /count: "exact", head: true/);
  assert.match(list, /grid min-w-0 gap-3 xl:hidden/);
  assert.match(list, /Certifications could not be loaded/);
  assert.match(edit, /Certification could not be loaded/);
  assert.match(form, /<BuildlogSelect id="certification-status"/);
  assert.match(form, /<BuildlogSelect id="certification-category"/);
  assert.match(form, /setValueAs: \(value: string\) => value === "" \? NaN : Number\(value\)/);
  assert.match(form, /Discard unsaved certification changes/);
  assert.match(deletion, /confirmText="DELETE"/);
});
