import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Buildlog Admin list counts before paginating and keeps filter state", async () => {
  const list = await source("app/admin/(dashboard)/buildlog/page.tsx");
  assert.match(list, /const PAGE_SIZE = 10/);
  assert.match(list, /count: "exact", head: true/);
  assert.match(
    list,
    /\.range\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE - 1\)/,
  );
  assert.match(list, /aria-label="Buildlog pages"/);
  assert.match(list, /No projects match these filters/);
  assert.match(list, /params\.cache === "stale"/);
  assert.match(list, /corrected\.searchParams\.set\("notice", "deleted"\)/);
  assert.match(
    list,
    /<DeleteBuildlogButton id=\{project\.id\} name=\{project\.name\} updatedAt=\{project\.updated_at\} \/>/,
  );
});

test("Buildlog Admin edits fail on stale timestamps and never upsert settings", async () => {
  const [api, settingsApi, form, settingsForm, deletion, guard] = await Promise.all([
    source("app/api/admin/buildlog/route.ts"),
    source("app/api/admin/buildlog/settings/route.ts"),
    source("app/components/admin/BuildlogForm.tsx"),
    source("app/components/admin/BuildlogSettingsForm.tsx"),
    source("app/components/admin/DeleteBuildlogButton.tsx"),
    source("app/components/admin/useBuildlogNavigationGuard.ts"),
  ]);
  assert.equal((api.match(/\.eq\("updated_at", updatedAt\)/g) || []).length, 2);
  assert.match(api, /status: existing \? 409 : 404/);
  assert.match(settingsApi, /\.eq\("updated_at", updated_at\)/);
  assert.match(api, /warning: "Project deleted, but the public Buildlog cache could not be refreshed/);
  assert.match(settingsApi, /warning: "Settings saved, but the public Buildlog cache could not be refreshed/);
  assert.doesNotMatch(settingsApi, /\.upsert\(/);
  assert.match(form, /updated_at: initialData\.updated_at/);
  assert.match(
    settingsForm,
    /reset\(\{ \.\.\.values, updated_at: result\.data\.updated_at \}\)/,
  );
  assert.match(form, /beforeunload/);
  assert.match(settingsForm, /beforeunload/);
  assert.match(form, /setValueAs: \(value: string\) => value === "" \? NaN : Number\(value\)/);
  assert.match(form, /useBuildlogNavigationGuard\(isDirty\)/);
  assert.match(settingsForm, /useBuildlogNavigationGuard\(isDirty\)/);
  assert.match(guard, /window\.history\.pushState\(currentState, "", currentUrl\)/);
  assert.match(guard, /button\?\.textContent\?\.trim\(\) === "Sign Out"/);
  assert.match(form, /<fieldset disabled=\{isSubmitting\}/);
  assert.match(settingsForm, /<fieldset disabled=\{isSubmitting\}/);
  assert.match(
    form,
    /aria-invalid=\{Boolean\(errors\.items\?\.\[index\]\?\.title\)\}/,
  );
  assert.match(deletion, /confirmText=\{name\}/);
  assert.doesNotMatch(deletion, /window\.confirm\(/);
});
