import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { defaultBlogSummary, normalizeBlogSlug, serializeBlogPublishDate, toLocalBlogDateTime } from "../app/lib/blog-defaults.ts";

test("new Blog slugs normalize titles but remain editable", async () => {
  assert.equal(normalizeBlogSlug("  Crème & Code: 101! "), "creme-code-101");
  const form = await readFile(new URL("../app/components/admin/BlogForm.tsx", import.meta.url), "utf8");
  assert.match(form, /slugEdited\.current = true/);
  assert.match(form, /if \(!slugEdited\.current\) setValue\("slug", normalizeBlogSlug/);
  for (const id of ["blog-title", "blog-slug", "blog-summary", "blog-status", "blog-published-at", "blog-cover-url", "blog-canonical-url", "blog-tag-input"]) {
    assert.match(form, new RegExp(`htmlFor="${id}"`));
    assert.match(form, new RegExp(`id="${id}"`));
  }
  assert.match(form, /aria-label=\{`Remove \$\{tag\} tag`\}/);
  assert.match(form, /aria-label="Add tag"/);
});

test("missing summaries get a concise prose excerpt, never fenced code", async () => {
  const source = "# Heading\n\n```ts\nsecret()\n```\n\nA **useful** introduction with [context](https://example.com).";
  assert.equal(defaultBlogSummary(source, "Fallback title"), "A useful introduction with context.");
  assert.equal(defaultBlogSummary("# Heading", "Fallback title"), "Fallback title");
  assert.ok(defaultBlogSummary("Long text ".repeat(40), "Title").length <= 160);
  const api = await readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8");
  assert.equal((api.match(/defaultBlogSummary\(post\.content, post\.title\)/g) || []).length, 1);
});

test("unchanged publication dates preserve the exact stored instant", () => {
  const previous = "2026-10-01T12:34:56.123456+00:00";
  assert.equal(serializeBlogPublishDate(toLocalBlogDateTime(previous), previous), previous);
  assert.equal(serializeBlogPublishDate("", previous), "");
  assert.equal(serializeBlogPublishDate("2026-10-02T12:35"), new Date("2026-10-02T12:35").toISOString());
});
