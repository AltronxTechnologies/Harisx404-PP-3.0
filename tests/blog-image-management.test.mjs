import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { blogImageUrls } from "../app/lib/admin/blog-image-urls.ts";
import { blogCanonicalUrl } from "../app/lib/blog-defaults.ts";

test("article image discovery finds Markdown and MDX images without treating code or links as images", () => {
  const content = [
    "![Photo](https://example.com/photo.jpg)",
    '<Image src="https://example.com/second.jpg" alt="Second" />',
    '<img src="https://example.com/third.jpg" />',
    "[link](https://example.com/not-an-image.jpg)",
    "```md\n![sample](https://example.com/example-only.jpg)\n```",
    "![Again](https://example.com/photo.jpg)",
    "![Referenced][old-image]",
    "[old-image]: https://example.com/reference.jpg",
  ].join("\n\n");
  assert.deepEqual(blogImageUrls(content), [
    "https://example.com/photo.jpg",
    "https://example.com/second.jpg",
    "https://example.com/third.jpg",
    "https://example.com/reference.jpg",
  ]);
});

test("canonical URL follows the normalized slug on the configured site, not the preview host", () => {
  const site = "https://harisx404.vercel.app";
  assert.equal(blogCanonicalUrl("New Post!", site), `${site}/blog/new-post`);
  assert.equal(
    blogCanonicalUrl("Renamed Post", site),
    `${site}/blog/renamed-post`,
  );
  assert.equal(blogCanonicalUrl("", site), "");
});

test("post images are guarded by an atomic save and a referenced-media delete boundary", async () => {
  const [save, deletion, migration] = await Promise.all([
    readFile(
      new URL("../app/api/admin/blogs/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/api/admin/media/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../migrations/2026_blog_post_media.sql", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(save, /resolveBlogImages\(data\)/);
  assert.match(save, /resolveBlogImages\(data, data\.id\)/);
  assert.match(save, /if \(!data\.image_ids && existingId\)/);
  assert.match(save, /blogImageUrls\(data\.content\)/);
  assert.match(save, /blogCanonicalUrl\(post\.slug, siteMetadata\.siteUrl\)/);
  assert.match(
    migration,
    /result := public\.save_blog_post_with_tags_base\(p_post, p_tags, p_id, p_expected_updated_at\)/,
  );
  assert.match(
    migration,
    /DELETE FROM public\.blog_post_media WHERE blog_post_id = saved_id/,
  );
  assert.match(migration, /REFERENCES public\.media\(id\) ON DELETE RESTRICT/);
  assert.match(deletion, /detach_blog_post_id/);
  assert.match(deletion, /cloudinary\.uploader\.destroy/);
});

test("Blog image reads and media edits/deletes reject anonymous callers", async () => {
  const base = process.env.BLOG_BASE_URL || "http://localhost:3000";
  for (const [path, method, body] of [
    ["/api/admin/blogs/images", "GET", undefined],
    [
      "/api/admin/media",
      "PATCH",
      JSON.stringify({
        id: "00000000-0000-4000-8000-000000000123",
        alt_text: "Changed",
      }),
    ],
    [
      "/api/admin/media?id=00000000-0000-4000-8000-000000000123&detach_blog_post_id=00000000-0000-4000-8000-000000000124",
      "DELETE",
      undefined,
    ],
  ]) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });
    assert.equal(
      response.status,
      401,
      `${method} ${path} should require Admin identity`,
    );
  }
});
