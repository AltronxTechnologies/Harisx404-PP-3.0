import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/lib/admin/delete-media.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
const removals = [];
runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === "server-only" || name === "@/app/lib/supabase/server") return {};
    if (name === "cloudinary") return { v2: { config() {}, uploader: { async destroy(id) { removals.push(id); return { result: "ok" }; } } } };
    return require(name);
  },
  process: { env: { CLOUDINARY_CLOUD_NAME: "test", CLOUDINARY_API_KEY: "test", CLOUDINARY_API_SECRET: "test" } },
  Set,
  Error,
});
const { deleteManagedMedia } = exports;
const media = { id: "media-1", public_id: "folder/asset", url: "http://cdn.test/folder/asset", secure_url: "https://cdn.test/folder/asset" };

function database(rows = {}, { missing = [], failure = null } = {}) {
  const writes = [];
  const reads = [];
  const tables = { media: [media], blog_post_media: [], blog_posts: [], projects: [], project_images: [], testimonials: [], experience: [], certifications: [], ...rows };
  const db = {
    from(table) {
      let action = "read";
      let column;
      let value;
      let match = "eq";
      let options;
      return {
        select(_fields, opts) { options = opts; return this; },
        eq(key, expected) { column = key; value = expected; match = "eq"; return this; },
        ilike(key, expected) { column = key; value = expected; match = "ilike"; return this; },
        limit() { return this; },
        delete() { action = "delete"; writes.push([table, "delete"]); return this; },
        insert(row) { writes.push([table, "insert"]); tables[table].push(row); return Promise.resolve({ error: null }); },
        maybeSingle() { return Promise.resolve(this.result(true)); },
        then(resolve, reject) { return Promise.resolve(this.result(false)).then(resolve, reject); },
        result(single) {
          if (action === "read") reads.push([table, column, value]);
          if (missing.includes(`${table}.${column}`)) return { count: null, error: options?.head ? null : { code: "42703" } };
          if (failure === `${table}.${column}`) return { count: null, error: { code: "XX000" } };
          const found = tables[table].filter((row) => !column || (match === "eq" ? row[column] === value :
            String(row[column] ?? "").toLowerCase().includes(value.slice(1, -1).replace(/\\([\\%_])/g, "$1").toLowerCase())));
          if (action === "delete") for (const row of found) tables[table].splice(tables[table].indexOf(row), 1);
          return { data: options?.head ? null : single ? found[0] ?? null : found, count: options?.count ? found.length : null, error: null };
        },
      };
    },
  };
  return { db, writes, reads };
}

test("Admin image URL references block deletion before any write or Cloudinary call", async (t) => {
  for (const [table, column] of [
    ["testimonials", "avatar_url"], ["experience", "logo_url"],
    ["certifications", "issuer_logo_url"], ["certifications", "badge_image_url"],
  ]) {
    for (const url of [media.url, media.secure_url]) {
      await t.test(`${table}.${column} ${url}`, async () => {
        removals.length = 0;
        const { db, writes } = database({ [table]: [{ id: "content-1", [column]: url }] });
        const result = await deleteManagedMedia(db, media.id);
        assert.equal(result.kind, "in_use");
        assert.deepEqual(writes, []);
        assert.deepEqual(removals, []);
      });
    }
  }
});

test("optional ID links and Cloudinary URL variants are protected", async () => {
  for (const [table, column, value] of [
    ["testimonials", "media_id", media.id],
    ["experience", "media_id", media.id],
    ["certifications", "media_id", media.id],
    ["experience", "logo_url", "https://cdn.test/transformed/folder/asset.jpg"],
  ]) {
    const { db, writes } = database({ [table]: [{ id: "content-1", [column]: value }] });
    assert.equal((await deleteManagedMedia(db, media.id)).kind, "in_use");
    assert.deepEqual(writes, []);
  }
});

test("unreferenced media deletes when optional legacy columns are absent", async () => {
  removals.length = 0;
  const { db, writes } = database({}, {
    missing: ["testimonials.media_id", "experience.media_id", "certifications.media_id", "experience.logo_url", "certifications.issuer_logo_url", "certifications.badge_image_url"],
  });
  assert.equal((await deleteManagedMedia(db, media.id)).kind, "deleted");
  assert.deepEqual(writes, [["media", "delete"]]);
  assert.deepEqual(removals, [media.public_id]);
});

test("unreferenced tracked uploads still delete with current Admin columns", async () => {
  removals.length = 0;
  const { db, writes } = database();
  assert.equal((await deleteManagedMedia(db, media.id)).kind, "deleted");
  assert.deepEqual(writes, [["media", "delete"]]);
  assert.deepEqual(removals, [media.public_id]);
});

test("failed reference reads fail closed before any delete", async () => {
  for (const failure of ["testimonials.avatar_url", "experience.logo_url", "certifications.badge_image_url", "experience.media_id", "certifications.media_id"]) {
    removals.length = 0;
    const { db, writes } = database({}, { failure });
    const result = await deleteManagedMedia(db, media.id);
    assert.equal(result.kind, "error", failure);
    assert.deepEqual(writes, []);
    assert.deepEqual(removals, []);
  }
});

test("a missing required testimonial image column fails closed", async () => {
  const { db, writes } = database({}, { missing: ["testimonials.avatar_url"] });
  assert.equal((await deleteManagedMedia(db, media.id)).kind, "error");
  assert.deepEqual(writes, []);
});
