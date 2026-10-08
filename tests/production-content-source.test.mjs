import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import matter from "gray-matter";
import { validateBlogMdx } from "../app/lib/blog-mdx-policy.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const readSources = (directory) => readdirSync(path.join(root, directory))
  .filter((name) => name.endsWith(".mdx"))
  .map((name) => ({ name, ...matter(readFileSync(path.join(root, directory, name), "utf8")) }));

test("new Blog sources parse safely, have real draft covers and no editorial prompts", () => {
  const posts = readSources("blogs");
  assert.equal(posts.length, 10);
  const slugs = new Set(posts.map(({ data }) => data.slug));
  assert.equal(slugs.size, posts.length);
  for (const { name, data, content } of posts) {
    assert.ok(data.title && data.slug && data.date, name);
    assert.equal(data.coverImage, "/blog/production-placeholder.jpg", name);
    assert.ok(existsSync(path.join(root, "public", data.coverImage)), name);
    assert.match(data.coverImageAlt, /Temporary.*placeholder|Temporary.*pending|Temporary.*cover/i, name);
    assert.equal(content.match(/^# (.+)$/m)?.[1], data.title, name);
    assert.doesNotMatch(content, /Image Prompt|Placement:/, name);
    assert.doesNotThrow(() => validateBlogMdx(content), name);
    for (const [, slug] of content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      assert.ok(slugs.has(slug), `${name} links to missing staged article ${slug}`);
    }
  }
});

test("new Project sources preserve existing canonical identity and renderable Markdown", () => {
  const projects = readSources("projects");
  assert.equal(projects.length, 6);
  assert.equal(new Set(projects.map(({ data }) => data.slug)).size, projects.length);
  for (const { name, data, content } of projects) {
    assert.ok(data.title && data.slug && data.tagline && content.trim(), name);
    assert.doesNotMatch(content, /^\|.+\|$/m, `${name}: Project renderer does not enable GFM tables`);
  }
  assert.ok(projects.some(({ data }) => data.slug === "packetvision-network-sniffer"));
  assert.doesNotMatch(projects.find(({ data }) => data.slug === "intrushield-nids").content, /Default Demo:/);
});
