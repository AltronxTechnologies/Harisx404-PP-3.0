import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/admin/(dashboard)/logs/actions.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup() {
  const calls = [];
  let authorized = true;
  let failure = null;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "@/app/lib/admin-auth") return { requireAdmin: async () => ({ response: authorized ? null : {} }) };
      if (name === "@/app/lib/supabase/server") return { createSupabaseAdminClient: async () => ({ from(table) {
        calls.push(["table", table]);
        return { update(payload) {
          calls.push(["update", payload.resolved]);
          return { eq(column, value) {
            calls.push(["filter", column, value]);
            return Promise.resolve({ error: failure });
          } };
        } };
      } }) };
      if (name === "next/cache") return { revalidatePath: (path) => calls.push(["revalidate", path]) };
      return require(name);
    },
    console: { error() {} },
  });
  return { action: exports.resolveAllLogs, calls, setAuthorized(value) { authorized = value; }, setFailure(value) { failure = value; } };
}

test("bulk resolve denies unauthenticated callers without touching the database", async () => {
  const subject = setup();
  subject.setAuthorized(false);
  assert.equal((await subject.action()).success, false);
  assert.deepEqual(subject.calls, []);
});

test("bulk resolve updates only unresolved logs and refreshes the Admin list", async () => {
  const subject = setup();
  assert.equal((await subject.action()).success, true);
  assert.deepEqual(subject.calls, [
    ["table", "system_logs"], ["update", true], ["filter", "resolved", false], ["revalidate", "/admin/logs"],
  ]);
});

test("bulk resolve reports a failed update without claiming success", async () => {
  const subject = setup();
  subject.setFailure({ code: "XX000" });
  const result = await subject.action();
  assert.equal(result.success, false);
  assert.match(result.error, /Unable to resolve all logs/);
  assert.equal(subject.calls.some(([type]) => type === "revalidate"), false);
});
