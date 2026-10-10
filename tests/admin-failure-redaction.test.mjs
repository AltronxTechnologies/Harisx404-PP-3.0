import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("FAQ failures do not expose database messages", async () => {
  const source = readFileSync(new URL("../app/api/admin/faqs/route.ts", import.meta.url), "utf8");
  const exports = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === "next/cache") return { revalidatePath() {} };
      if (name === "@/app/lib/admin-auth") return { requireAdmin: async () => ({ response: null }) };
      if (name === "@/app/lib/supabase/server") return { createSupabaseAdminClient: async () => ({
        from: () => ({
          select() { return this; },
          order() { return this; },
          then(resolve) { resolve({ data: null, error: { code: "42501", message: "private database detail" } }); },
        }),
      }) };
      return require(name);
    },
    console: { error() {} },
    Response,
  });
  const response = await exports.GET();
  assert.equal(response.status, 500);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private database detail/);
});

test("Project save fallback no longer returns arbitrary database exceptions", () => {
  const source = readFileSync(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8");
  assert.match(source, /Project request could not be completed\. Refresh before retrying/);
  assert.match(source, /Project data could not be saved\. Review the selected fields and try again/);
  assert.doesNotMatch(source, /error: error instanceof Error \? error\.message/);
  assert.match(source, /error\.message === "Gallery contains an unknown media ID"/);
});
