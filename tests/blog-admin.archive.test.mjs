import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("archive endpoint rejects unauthenticated requests before parsing or mutation", async () => {
  for (const body of ["not json", JSON.stringify({
    id: "00000000-0000-4000-8000-000000000000",
    updated_at: "2026-01-01T00:00:00Z",
    action: "archive",
  })]) {
    const response = await fetch(`${baseUrl}/api/admin/blogs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    assert.equal(response.status, 401);
  }
});

test("archive and restore retain posts with guarded state transitions", async () => {
  const [api, list, action, edit, policy, publicRead, migration] = await Promise.all([
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/blogs/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/blogs/BlogArchiveAction.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/blogs/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_blog_publication_policy.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/utils.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_blog_editor_delete_slug_history.sql", import.meta.url), "utf8"),
  ]);

  const patch = api.slice(api.indexOf("export async function PATCH"), api.indexOf("export async function DELETE"));
  assert.match(patch, /await authorizeAdmin\(\)/);
  assert.ok(patch.indexOf("await authorizeAdmin()") < patch.indexOf("request.json()"));
  assert.match(api, /user\.email\?\.toLowerCase\(\) !== adminEmail/);
  assert.match(api, /id: z\.string\(\)\.uuid\(\)/);
  assert.match(api, /updated_at: z\.string\(\)\.datetime\(\{ offset: true \}\)/);
  assert.match(api, /action: z\.enum\(\["archive", "restore"\]\)/);
  assert.match(patch, /admin\.rpc\("transition_blog_post"/);
  assert.match(patch, /p_expected_updated_at: updated_at/);
  assert.match(migration, /target\.status IN \('draft', 'published'\)/);
  assert.match(migration, /target\.status IS DISTINCT FROM 'archived'/);
  assert.match(migration, /INSERT INTO public\.blog_slug_history \(slug, post_id\)/);
  assert.doesNotMatch(patch, /\.delete\(/);
  assert.match(patch, /revalidateBlogPaths\(post\.slug\)/);
  assert.match(api, /revalidatePath\("\/admin\/blogs"\)/);
  assert.match(api, /current\.status === "archived"/);
  assert.match(edit, /blog\.status === "archived"\) notFound\(\)/);
  assert.match(list, /\{ data: blogs, error: postsError \}/);
  assert.match(list, /role="alert"/);
  assert.match(action, /setDialog\("archive"\)/);
  assert.match(action, /confirmText=\{dialog === "delete" \? post\.slug : undefined\}/);
  assert.doesNotMatch(action, /window\.confirm|window\.prompt/);
  assert.match(action, /role="alert"/);
  assert.match(list, /rawParams\.notice === "archived"/);
  assert.match(list, /role="status"/);
  assert.match(policy, /status = 'published'/);
  assert.match(publicRead, /\.eq\('status', 'published'\)/);
});

test("legacy Blog posts stay in source mode while rich-authored posts can reopen in the editor", async () => {
  const [form, api] = await Promise.all([
    readFile(new URL("../app/components/admin/BlogForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(form, /!initialData\?\.id \|\| initialData\.editor_mode === "rich"/);
  assert.match(form, /!richEditor \? \(\s*<textarea/);
  assert.match(form, /richContentEdited\.current \? initialData\.content : data\.content/);
  assert.match(form, /\{\.\.\.field\}\s+id="blog-content-source"/);
  assert.match(form, /rich editor can remove embeds and custom formatting/);
  assert.match(api, /refine\(\(value\) => value\.trim\(\)\.length > 0, "Content is required"\)/);
  assert.doesNotMatch(api, /replace\(\/\\r\\n\?\/g, "\\n"\)\.trim\(\)/);
  assert.match(form, /cover_image_url: initialData\.cover_image_url \|\| ""/);
  assert.match(form, /canonical_url: initialData\.canonical_url \|\| ""/);
});

test("manual cover URL edits clear their media ID and saves validate the pair", async () => {
  const [form, api, tagSync] = await Promise.all([
    readFile(new URL("../app/components/admin/BlogForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/tag-sync.ts", import.meta.url), "utf8"),
  ]);
  assert.match(form, /register\("cover_image_url", \{ onChange: \(\) => setValue\("cover_image_id", "", \{ shouldDirty: true \}\) \}\)/);
  assert.match(api, /coverUrl !== media\.secure_url && coverUrl !== media\.url/);
  assert.equal((api.match(/await validateCoverMedia\(data\.cover_image_id, data\.cover_image_url\)/g) || []).length, 2);
  assert.match(api, /code === "23505"/);
  assert.match(api, /Unable to save blog post\. Please try again\./);
  assert.match(tagSync, /if \(error\) throw error;/);
  assert.match(form, /data\.status === "published" && !data\.published_at/);
  assert.match(form, /new Date\(\)\.toISOString\(\)/);
  assert.match(form, /Clear this field to publish immediately/);
  assert.match(form, /publishingNow \? "Publish Now"/);
  assert.match(form, /<AdminConfirmDialog/);
  assert.match(form, /beforeunload/);
  assert.match(form, /formState: \{ errors, isDirty \}/);
  assert.doesNotMatch(form, /window\.confirm|window\.prompt/);
  for (const [field, name] of [["title", "title"], ["slug", "slug"], ["summary", "summary"], ["status", "status"], ["published-at", "published_at"], ["cover-url", "cover_image_url"], ["canonical-url", "canonical_url"], ["tags", "tags"], ["content", "content"]]) {
    assert.match(form, new RegExp(`id="blog-${field}-error"`));
    assert.match(form, new RegExp(`aria-describedby=\\{errors\\.${name}`));
  }
});
