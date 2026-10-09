import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const route = {};
let db;
runInNewContext(compiled, {
  exports: route,
  require(name) {
    if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
    if (name === "next/cache") return { revalidatePath() {}, revalidateTag() {} };
    if (name === "@/app/lib/supabase/server") return {
      default: async () => ({ auth: { getUser: async () => ({ data: { user: { email: "admin@test.local" } }, error: null }) } }),
      createSupabaseAdminClient: async () => db,
    };
    if (name === "@/app/lib/project-captions") return { captionWordCount: (value) => value.trim().split(/\s+/).filter(Boolean).length };
    if (name === "@/app/lib/project-stage") return { projectStages: ["completed", "in_progress"] };
    if (name === "@/app/lib/blog-defaults") return { isValidBlogDate: () => true };
    return require(name);
  },
  process: { env: { ADMIN_EMAIL: "admin@test.local" } },
  console: { error() {} },
  Response,
  URL,
});

const coverId = "11111111-1111-4111-8111-111111111111";
const tracked = { url: "http://media.test/cover.jpg", secure_url: "https://media.test/cover.jpg" };
const payload = {
  title: "Project", slug: "project", status: "draft", category: "Web App",
  cover_image_id: coverId, cover_image_url: tracked.secure_url,
};

function database({ media = tracked, error = null, throws = false, featured = false } = {}) {
  const reads = [];
  const writes = [];
  db = {
    from(table) {
      if (table === "projects") return {
        select() { return this; },
        async contains() { return { data: [], error: null }; },
        eq() { return this; },
        async maybeSingle() { return { data: { featured }, error: null }; },
      };
      assert.equal(table, "media");
      return {
        select(columns) { reads.push(["select", columns]); return this; },
        eq(column, value) { reads.push(["eq", column, value]); return this; },
        async maybeSingle() {
          if (throws) throw new Error("internal database detail");
          return { data: media, error };
        },
      };
    },
    async rpc(name, args) {
      writes.push([name, args]);
      return { data: { project: { id: coverId, slug: "project" }, old_slug: "old-project" }, error: null };
    },
  };
  return { reads, writes };
}

test("ordinary Project saves cannot bypass or silently drop the Home selection", async () => {
  let state = database();
  assert.equal((await save("POST", { featured: true })).status, 400);
  assert.equal(state.writes.length, 0);

  state = database({ featured: true });
  assert.equal((await save("PUT", { featured: false })).status, 409);
  assert.equal(state.writes.length, 0);

  state = database({ featured: true });
  assert.equal((await save("PUT", { featured: true, status: "archived" })).status, 409);
  assert.equal(state.writes.length, 0);

  state = database({ featured: null });
  assert.equal((await save("PUT", { featured: false })).status, 200);
  assert.equal(state.writes.length, 1);
});

async function save(method, fields = {}) {
  const body = { ...payload, ...fields };
  if (method === "PUT") Object.assign(body, { id: "22222222-2222-4222-8222-222222222222", updated_at: "2026-01-01T00:00:00Z" });
  const request = new Request("http://localhost/api/admin/projects", { method, body: JSON.stringify(body) });
  return route[method](request);
}

for (const method of ["POST", "PUT"]) {
  test(`${method} accepts either tracked cover URL and passes the pair to the atomic save`, async () => {
    for (const url of [tracked.url, tracked.secure_url]) {
      const { reads, writes } = database();
      const response = await save(method, { cover_image_url: url });
      assert.equal(response.status, 200);
      assert.deepEqual(reads, [["select", "url, secure_url"], ["eq", "id", coverId]]);
      assert.equal(writes.length, 1);
      assert.equal(writes[0][0], "save_project_with_gallery_and_tags");
      assert.equal(writes[0][1].p_project.cover_image_id, coverId);
      assert.equal(writes[0][1].p_project.cover_image_url, url);
    }
  });

  test(`${method} preserves manual cover URLs without a media lookup`, async () => {
    for (const id of ["", undefined]) {
      const { reads, writes } = database();
      const response = await save(method, { cover_image_id: id, cover_image_url: "https://external.test/manual.jpg" });
      assert.equal(response.status, 200);
      assert.deepEqual(reads, []);
      assert.equal(writes.length, 1);
      assert.equal(writes[0][1].p_project.cover_image_id, null);
    }
  });

  test(`${method} rejects missing and mismatched media before the atomic save`, async () => {
    for (const [options, fields] of [
      [{ media: null }, {}],
      [{}, { cover_image_url: "https://external.test/other.jpg" }],
    ]) {
      const { writes } = database(options);
      const response = await save(method, fields);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Choose a matching cover image from the media library." });
      assert.deepEqual(writes, []);
    }
  });

  test(`${method} fails closed on media lookup errors without leaking database details`, async () => {
    for (const options of [{ error: { message: "internal database detail" } }, { throws: true }]) {
      const { writes } = database(options);
      const response = await save(method);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "Could not verify the cover image. Try again later." });
      assert.deepEqual(writes, []);
    }
  });
}
