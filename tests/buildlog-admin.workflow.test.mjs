import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Buildlog Admin list counts before paginating and keeps filter state", async () => {
  const [list, filters, select] = await Promise.all([
    source("app/admin/(dashboard)/buildlog/page.tsx"),
    source("app/components/admin/BuildlogListFilters.tsx"),
    source("app/components/admin/BuildlogSelect.tsx"),
  ]);
  assert.match(list, /const PAGE_SIZE = 10/);
  assert.match(list, /count: "exact", head: true/);
  assert.match(
    list,
    /\.range\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE - 1\)/,
  );
  assert.match(list, /aria-label="Buildlog pages"/);
  assert.match(list, /No projects match these filters/);
  assert.match(list, /<BuildlogListFilters key=\{`\$\{q\}:\$\{status\}`\}/);
  assert.match(filters, /name="status"/);
  assert.match(select, /ListboxOptions anchor="bottom" modal=\{false\}/);
  assert.match(select, /ListboxOption/);
  assert.match(select, /min-h-11/);
  assert.doesNotMatch(list, /Page settings|\/admin\/buildlog\/settings/);
  assert.match(list, /params\.cache === "stale"/);
  assert.match(list, /corrected\.searchParams\.set\("notice", "deleted"\)/);
  assert.match(
    list,
    /<DeleteBuildlogButton id=\{project\.id\} name=\{project\.name\} updatedAt=\{project\.updated_at\} \/>/,
  );
});

test("Buildlog Admin edits fail on stale timestamps and per-page settings are static", async () => {
  const [api, form, deletion, guard, settings, redirect] = await Promise.all([
    source("app/api/admin/buildlog/route.ts"),
    source("app/components/admin/BuildlogForm.tsx"),
    source("app/components/admin/DeleteBuildlogButton.tsx"),
    source("app/components/admin/useAdminNavigationGuard.ts"),
    source("app/buildlog/data.ts"),
    source("app/admin/(dashboard)/buildlog/settings/page.tsx"),
  ]);
  assert.equal((api.match(/\.eq\("updated_at", updatedAt\)/g) || []).length, 2);
  assert.match(api, /status: existing \? 409 : 404/);
  assert.match(api, /warning: "Project deleted, but the public Buildlog cache could not be refreshed/);
  assert.match(form, /updated_at: initialData\.updated_at/);
  assert.match(form, /beforeunload/);
  assert.match(form, /setValueAs: \(value: string\) => value === "" \? NaN : Number\(value\)/);
  assert.match(form, /useAdminNavigationGuard\(isDirty\)/);
  assert.match(form, /<BuildlogSelect id="buildlog-status"/);
  assert.match(form, /<BuildlogSelect id="buildlog-lifecycle"/);
  assert.doesNotMatch(form, /<select/);
  assert.match(guard, /window\.history\.pushState\(currentState, "", currentUrl\)/);
  assert.match(guard, /button\?\.textContent\?\.trim\(\) === "Sign Out" \|\| button\?\.getAttribute\("aria-label"\) === "Sign Out"/);
  assert.match(form, /<fieldset disabled=\{isSubmitting\}/);
  assert.match(settings, /export const buildlogPageSettings/);
  assert.doesNotMatch(settings, /public_buildlog_settings|fetchBuildlogSettings/);
  assert.match(redirect, /redirect\("\/admin\/buildlog"\)/);
  assert.match(
    form,
    /aria-invalid=\{Boolean\(errors\.items\?\.\[index\]\?\.title\)\}/,
  );
  assert.match(deletion, /confirmText=\{name\}/);
  assert.doesNotMatch(deletion, /window\.confirm\(/);
});
