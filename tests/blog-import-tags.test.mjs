import assert from "node:assert/strict";
import test from "node:test";
import { parseBlogImportTags } from "../app/lib/admin/blog-import-tags.ts";

test("MDX import reads list and inline YAML tags without silently keeping old tags", () => {
  assert.deepEqual(parseBlogImportTags("title: Example\ntags:\n  - web\n  - security\nsummary: Example"), ["web", "security"]);
  assert.deepEqual(parseBlogImportTags('tags: [web, "C, C++", security]'), ["web", "C, C++", "security"]);
  assert.deepEqual(parseBlogImportTags("tags: []"), []);
  assert.equal(parseBlogImportTags("title: Example"), null);
});

test("MDX import rejects unsupported or oversized tag fields before changing the form", () => {
  assert.throws(() => parseBlogImportTags("tags: web, security"), /Tags must be a YAML list/);
  assert.throws(() => parseBlogImportTags("tags: [" + "x,".repeat(11) + "]"), /at most 10 tags/);
  assert.throws(() => parseBlogImportTags("tags: [" + "x".repeat(51) + "]"), /no more than 50 characters/);
});
