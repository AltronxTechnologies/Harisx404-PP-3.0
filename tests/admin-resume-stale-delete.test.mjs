import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/api/admin/resume/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const revision = "2026-10-09T12:00:00.000Z";

function setup({ currentRevision = revision, race = false } = {}) {
  const calls = { filters: [], updates: 0, removed: 0 };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === "next/cache") return { revalidatePath() {}, revalidateTag() {} };
      if (name === "@/app/data/resume") return { RESUME_STORAGE_BUCKET: "test-bucket", RESUME_MAX_BYTES: 10485760 };
      if (name === "@/app/lib/supabase/server") return {
        default: async () => ({ auth: { getUser: async () => ({ data: { user: { email: "owner@test.local" } } }) } }),
        createSupabaseAdminClient: async () => ({
          from() { return {
            select() { return this; }, eq(column, value) { calls.filters.push([column, value]); return this; },
            async single() { return { data: { storage_path: "test.pdf", updated_at: currentRevision }, error: null }; },
            update() { calls.updates++; return this; },
            async maybeSingle() { return { data: race ? null : { updated_at: "2026-10-09T12:01:00.000Z" }, error: null }; },
          }; },
          storage: { from() { return { async remove() { calls.removed++; return { error: null }; } }; } },
        }),
      };
      return require(name);
    },
    process: { env: { ADMIN_EMAIL: "owner@test.local" } },
    console: { error() {} },
    Response,
    URL,
    Date,
  });
  const invoke = (updatedAt) => exports.DELETE(new Request("http://localhost/api/admin/resume", {
    method: "DELETE", body: JSON.stringify(updatedAt ? { updatedAt } : {}),
  }));
  return { invoke, calls };
}

test("stale Resume confirmation cannot unpublish a newer PDF", async () => {
  const { invoke, calls } = setup({ currentRevision: "2026-10-09T12:01:00.000Z" });
  const response = await invoke(revision);
  assert.equal(response.status, 409);
  assert.equal(calls.updates, 0);
  assert.equal(calls.removed, 0);
});

test("missing token and a race after read fail without Storage removal", async () => {
  const missing = setup();
  assert.equal((await missing.invoke()).status, 400);
  assert.equal(missing.calls.updates, 0);
  const raced = setup({ race: true });
  assert.equal((await raced.invoke(revision)).status, 409);
  assert.ok(raced.calls.filters.some(([column, value]) => column === "updated_at" && value === revision));
  assert.equal(raced.calls.removed, 0);
});

test("confirmed deletion uses the displayed revision and removes only the prior path", async () => {
  const { invoke, calls } = setup();
  const response = await invoke(revision);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.isActive, false);
  assert.ok(calls.filters.some(([column, value]) => column === "updated_at" && value === revision));
  assert.equal(calls.updates, 1);
  assert.equal(calls.removed, 1);
});
