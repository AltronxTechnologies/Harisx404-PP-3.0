import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Project attachment migration limits public reads and prevents cascading media deletion", async () => {
  const sql = await readFile(new URL("../migrations/2026_project_public_joins.sql", import.meta.url), "utf8");
  assert.match(sql, /ALTER TABLE public\.project_tags ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /ALTER TABLE public\.project_images ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON TABLE public\.project_tags, public\.project_images FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /projects\.status = 'published'/g);
  assert.match(sql, /REFERENCES public\.media\(id\) ON DELETE RESTRICT/);
});

test("public Project collection pages by a stable ID and fails instead of caching a partial result", async () => {
  const source = await readFile(new URL("../app/lib/utils.ts", import.meta.url), "utf8");
  const collection = source.slice(source.indexOf("export async function fetchProjects()"), source.indexOf("export async function getProjectBySlug("));
  assert.match(collection, /\.eq\('status', 'published'\)/);
  assert.match(collection, /\.order\('id', \{ ascending: true \}\)/);
  assert.match(collection, /\.limit\(pageSize\)/);
  assert.match(collection, /if \(lastId\) query = query\.gt\('id', lastId\)/);
  assert.match(collection, /if \(error \|\| !data\) throw new Error\('Project collection is unavailable'\)/);
  assert.match(collection, /projects\.sort\(/);
});

test("Projects index escapes script terminators in authored JSON-LD", async () => {
  const page = await readFile(new URL("../app/projects/page.tsx", import.meta.url), "utf8");
  assert.match(page, /JSON\.stringify\(itemListJsonLd\)\.replace\(\/<\/g, "\\\\u003c"\)/);
});
