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

test("Blog form offers Editor, MDX and unsaved Preview without silently converting custom MDX", async () => {
  const [form, codeEditor, unsavedPreview, api] = await Promise.all([
    readFile(new URL("../app/components/admin/BlogForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/BlogCodeEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/BlogUnsavedPreview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(form, /initialData\.editor_mode !== "rich" \|\| !canUseVisualBlogEditor\(initialData\.content\)/);
  assert.match(form, /editorMode === "source" \? \(\s*<BlogCodeEditor/);
  assert.match(form, /!richContentEdited\.current && data\.content === initialData\.content \? initialData\.content : data\.content/);
  assert.match(form, /role="tablist" aria-label="Blog writing mode"/);
  assert.match(form, /role="tabpanel" aria-labelledby=\{`blog-mode-\$\{editorMode\}`\}/);
  assert.match(form, /!canUseVisualBlogEditor\(getValues\("content"\) \|\| ""\)/);
  assert.match(form, /<BlogUnsavedPreview snapshot=\{previewSnapshot\}/);
  assert.match(form, /if \(switchMode\(next\)\) document\.getElementById/);
  assert.match(unsavedPreview, /validateBlogMdx\(post\.content\)/);
  assert.match(unsavedPreview, /\.\.\.sharedComponents, img: BlogArticleImage, Image: BlogArticleImage/);
  assert.match(unsavedPreview, /Article content cannot be safely previewed/);
  assert.match(form, /Visual Editor.*MDX \/ Code.*Preview/);
  assert.match(codeEditor, /preview="edit"/);
  assert.match(codeEditor, /Blog article MDX source/);
  assert.match(form, /MDX \/ Code preserves custom components/);
  assert.match(api, /refine\(\(value\) => value\.trim\(\)\.length > 0, "Content is required"\)/);
  assert.doesNotMatch(api, /replace\(\/\\r\\n\?\/g, "\\n"\)\.trim\(\)/);
  assert.match(form, /cover_image_url: initialData\.cover_image_url \|\| ""/);
  assert.match(form, /canonical_url: initialData\.canonical_url \|\| blogCanonicalUrl/);
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
  assert.match(form, /resolveBlogPublishDate\(/);
  assert.match(form, /<BlogDatePicker/);
  assert.match(form, /Defaults to today/);
  assert.match(form, /Choose a cover image before publishing/);
  assert.match(form, /<AdminConfirmDialog/);
  assert.match(form, /beforeunload/);
  assert.match(form, /formState: \{ errors, isDirty \}/);
  assert.doesNotMatch(form, /window\.confirm|window\.prompt/);
  for (const [field, name] of [["title", "title"], ["slug", "slug"], ["summary", "summary"], ["cover-url", "cover_image_url"], ["canonical-url", "canonical_url"], ["tags", "tags"]]) {
    assert.match(form, new RegExp(`id="blog-${field}-error"`));
    if (name === "tags") assert.match(form, /aria-describedby=\{`blog-tags-hint\$\{errors\.tags/);
    else assert.match(form, new RegExp(`aria-describedby=\\{errors\\.${name}`));
  }
  assert.match(form, /id="blog-status" aria-labelledby="blog-status-label blog-status" aria-invalid=\{Boolean\(errors\.status\)\} aria-describedby=\{errors\.status/);
  assert.match(form, /id="blog-published-at-error"/);
  assert.match(form, /errorId=\{errors\.content \? "blog-content-error" : undefined\}/);
});
