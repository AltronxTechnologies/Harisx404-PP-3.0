import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/api/admin/media/upload/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function uploadRoute({ insertErrors = [], destroyResult = "ok" } = {}) {
  const rows = [];
  const destroyed = [];
  let uploaded = 0;
  const result = { public_id: "portfolio/review", secure_url: "https://res.cloudinary.com/review/image/upload/review.png", width: 1, height: 1, format: "png", bytes: 68 };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options = {}) => Response.json(body, { status: options.status ?? 200 }) } };
      if (name === "@/app/lib/supabase/server") return {
        __esModule: true,
        default: async () => ({ auth: { getUser: async () => ({ data: { user: { email: "owner@example.test" } }, error: null }) } }),
        createSupabaseAdminClient: async () => ({ from: () => ({
          insert(input) { rows.push(input[0]); return this; },
          select() { return this; },
          async single() { const error = insertErrors[rows.length - 1]; return error ? { data: null, error } : { data: { id: "review-id", ...rows.at(-1) }, error: null }; },
        }) }),
      };
      if (name === "cloudinary") return { v2: {
        config() {},
        uploader: {
          upload_stream(_options, callback) { return { end() { uploaded++; callback(null, result); } }; },
          async destroy(id) { destroyed.push(id); return { result: destroyResult }; },
        },
      } };
      return require(name);
    },
    process: { env: { CLOUDINARY_CLOUD_NAME: "test", CLOUDINARY_API_KEY: "test", CLOUDINARY_API_SECRET: "test", ADMIN_EMAIL: "owner@example.test" } },
    Buffer, File, FormData, Promise, Response, URL,
  });
  return { POST: exports.POST, rows, destroyed, uploads: () => uploaded };
}

function request(name = "Exact image name.png", mimeType = "image/png", contents = "review") {
  const form = new FormData();
  form.append("file", new File([contents], name, { type: mimeType }));
  return { formData: async () => form };
}

test("Media upload stores the exact original filename separately from its description", async () => {
  const { POST, rows, destroyed, uploads } = uploadRoute();
  const response = await POST(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.original_filename, "Exact image name.png");
  assert.equal(body.data.alt_text, "Exact image name.png");
  assert.equal(rows[0].original_filename, "Exact image name.png");
  assert.equal(uploads(), 1);
  assert.deepEqual(destroyed, []);
});

test("Missing filename migration preserves upload but reports reduced filename guarantees", async () => {
  const { POST, rows, destroyed } = uploadRoute({ insertErrors: [{ code: "PGRST204", message: "original_filename is not in schema cache" }] });
  const response = await POST(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.warning, /filename cannot be protected/);
  assert.equal(rows.length, 2);
  assert.equal(JSON.stringify(rows[1]).includes("original_filename"), false);
  assert.deepEqual(destroyed, []);
});

test("Database failure attempts Cloudinary rollback and distinguishes failed cleanup", async () => {
  const failed = { code: "23505", message: "duplicate" };
  const rolledBack = uploadRoute({ insertErrors: [failed] });
  assert.equal((await rolledBack.POST(request())).status, 503);
  assert.deepEqual(rolledBack.destroyed, ["portfolio/review"]);
  const orphaned = uploadRoute({ insertErrors: [failed], destroyResult: "error" });
  const response = await orphaned.POST(request());
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /may remain in Cloudinary/);
});

test("Invalid images fail before reaching Cloudinary", async () => {
  const route = uploadRoute();
  assert.equal((await route.POST(request("blocked.svg", "image/svg+xml"))).status, 415);
  assert.equal((await route.POST(request("empty.png", "image/png", ""))).status, 400);
  assert.equal(route.uploads(), 0);
});
