import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Project Admin list bounds searches and counts results before pagination", async () => {
  const list = await source("app/admin/(dashboard)/projects/page.tsx");
  assert.match(list, /const PAGE_SIZE = 10/);
  assert.match(list, /q\.replace\(\/\[\\\\%_\]\/g/);
  assert.match(list, /count: "exact", head: true/);
  assert.match(
    list,
    /\.range\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE - 1\)/,
  );
  assert.match(list, /aria-label="Projects pages"/);
  assert.match(list, /updated_at/);
  assert.match(list, /space-y-3 p-4 xl:hidden/);
  assert.match(list, /hidden overflow-x-auto xl:block/);
});

test("Project editor preserves prior cover, announces validation and guards unsaved gallery changes", async () => {
  const [form, edit, creation] = await Promise.all([
    source("app/components/admin/ProjectForm.tsx"),
    source("app/admin/(dashboard)/projects/[id]/page.tsx"),
    source("app/admin/(dashboard)/projects/new/page.tsx"),
  ]);
  assert.match(form, /const chooseCover = \(image: GalleryImage\)/);
  assert.match(
    form,
    /mediaId: oldId, url: oldUrl, caption: oldCaption, altText: oldAlt/,
  );
  assert.match(form, /const galleryDirty = JSON\.stringify\(galleryImages\)/);
  assert.match(form, /const discardSessionUploads = async \(preserve = new Set<string>\(\)\) =>/);
  assert.match(form, /const stageFiles = \(event: React\.ChangeEvent<HTMLInputElement>\) =>/);
  assert.match(form, /await fetch\("\/api\/admin\/media\/upload", \{ method: "POST", body \}\)/);
  assert.match(form, /const cleaned = createdIds\.length \? await discardSessionUploads\(preserveOthers\)/);
  assert.match(form, /const optionalHttpUrl = z\.string\(\)\.refine/);
  assert.match(form, /live_url: optionalHttpUrl\.optional\(\)/);
  assert.match(form, /<AdminConfirmDialog open=\{leaveConfirmation\}/);
  assert.match(form, /setError\(name as keyof ProjectFormValues/);
  assert.match(form, /Check the highlighted fields before saving/);
  assert.match(edit, /if \(error \|\| optionsError\) return <div role="alert"/);
  assert.match(edit, /if \(!project\) notFound\(\)/);
  assert.match(creation, /if \(error\) return <div role="alert"/);
});

test("Project deletion uses a guarded token and requires the additive RPC", async () => {
  const [api, button, migration] = await Promise.all([
    source("app/api/admin/projects/route.ts"),
    source("app/components/admin/DeleteProjectButton.tsx"),
    source("migrations/2026_project_admin_atomic_delete_with_token.sql"),
  ]);
  assert.match(api, /p_expected_updated_at: updatedAt/);
  assert.match(
    api,
    /Apply migration 2026_project_admin_atomic_delete_with_token\.sql/,
  );
  assert.match(button, /confirmText=\{slug\}/);
  assert.doesNotMatch(button, /window\.confirm|window\.alert/);
  assert.match(migration, /WHERE id = p_id FOR UPDATE/);
  assert.match(
    migration,
    /current_updated_at IS DISTINCT FROM p_expected_updated_at/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.delete_project_and_unlink_related\(uuid, timestamptz\)\s+TO service_role/,
  );
});

test("Project writes return actionable duplicate-slug and missing-image conflicts", async () => {
  const api = await source("app/api/admin/projects/route.ts");
  assert.match(api, /error\.code === "23505"/);
  assert.match(api, /error\.message\.includes\("projects_slug_key"\)/);
  assert.match(api, /fieldErrors: \{ slug: \["Choose a different slug\."\] \}/);
  assert.match(api, /error\.code === "23503"/);
  assert.match(api, /A selected project attachment is no longer available/);
});
