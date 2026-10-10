import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/api/admin/settings/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const original = "2026-10-09T12:00:00.123456+00:00";

function setup({ revision = original, race = false } = {}) {
  const calls = { reads: [], writes: [], revalidated: [] };
  const row = {
    id: "settings-id", site_name: "Old name", seo_description: "", seo_keywords: "",
    github_url: "", twitter_url: "", linkedin_url: "", email_address: "", updated_at: revision,
  };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === "next/cache") return { revalidatePath: (path) => calls.revalidated.push(path) };
      if (name === "@/app/lib/admin-auth") return { requireAdmin: async () => ({ response: null }) };
      if (name === "@/app/lib/supabase/server") return { createSupabaseAdminClient: async () => ({
        from(table) {
          assert.equal(table, "site_settings");
          return {
            select(columns) {
              calls.reads.push(columns);
              return { limit: async () => ({ data: [row], error: null }) };
            },
            update(payload) {
              const write = { payload, filters: [], columns: null };
              calls.writes.push(write);
              return {
                eq(column, value) { write.filters.push([column, value]); return this; },
                select(columns) { write.columns = columns; return this; },
                async maybeSingle() {
                  if (race || write.filters.some(([column, value]) => column === "updated_at" && value !== row.updated_at)) {
                    return { data: null, error: null };
                  }
                  return { data: { id: row.id, updated_at: payload.updated_at }, error: null };
                },
              };
            },
          };
        },
      }) };
      return require(name);
    },
    Response, Date, console: { error() {} },
  });
  const put = (body) => exports.PUT(new Request("http://localhost/api/admin/settings", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  return { get: exports.GET, put, calls };
}

test("GET returns the original database revision, including nullable revisions", async () => {
  for (const revision of [original, null]) {
    const { get, calls } = setup({ revision });
    const response = await get();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).updated_at, revision);
    assert.match(calls.reads[0], /updated_at/);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});

test("stale or nullable database revision returns 409 without a write", async () => {
  for (const revision of ["2026-10-09T12:00:01+00:00", null]) {
    const { put, calls } = setup({ revision });
    const response = await put({ site_name: "New name", updated_at: original });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /reload before saving/);
    assert.equal(calls.writes.length, 0);
    assert.equal(calls.revalidated.length, 0);
  }
});

test("race after read is rejected by the atomic revision filter", async () => {
  const { put, calls } = setup({ race: true });
  const response = await put({ site_name: "New name", updated_at: original });
  assert.equal(response.status, 409);
  assert.equal(calls.writes.length, 1);
  assert.deepEqual(calls.writes[0].filters, [["id", "settings-id"], ["updated_at", original]]);
  assert.equal(calls.revalidated.length, 0);
});

test("confirmed save sends a newer server revision and returns the saved revision", async () => {
  const { put, calls } = setup();
  const response = await put({ site_name: "New name", updated_at: original });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.updated_at, calls.writes[0].payload.updated_at);
  assert.ok(Date.parse(body.updated_at) > Date.parse(original));
  assert.notEqual(body.updated_at, original);
  assert.equal(calls.writes[0].payload.site_name, "New name");
  assert.deepEqual(calls.writes[0].filters, [["id", "settings-id"], ["updated_at", original]]);
  assert.equal(calls.writes[0].columns, "id, updated_at");
  assert.deepEqual(calls.revalidated, ["/", "/about"]);
});

test("missing, null, malformed or token-only requests are invalid and never write", async () => {
  for (const body of [
    { site_name: "New name" },
    { site_name: "New name", updated_at: null },
    { site_name: "New name", updated_at: "not-a-date" },
    { updated_at: original },
  ]) {
    const { put, calls } = setup();
    const response = await put(body);
    assert.equal(response.status, 400);
    assert.equal(calls.reads.length, 0);
    assert.equal(calls.writes.length, 0);
  }
});
