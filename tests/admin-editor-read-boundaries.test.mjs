import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const id = "00000000-0000-4000-8000-000000000000";
const paths = [
  "blogs/new/page.tsx", "blogs/[id]/page.tsx",
  "projects/new/page.tsx", "projects/[id]/page.tsx",
];

function pageFor(path, { deniedStatus = null, readError = null, missing = false } = {}) {
  const source = readFileSync(new URL(`../app/admin/(dashboard)/${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  let serviceReads = 0;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "@/app/lib/admin-auth") return { requireAdmin: async () => deniedStatus ? { response: { status: deniedStatus } } : {} };
      if (name === "@/app/lib/supabase/server") return { createSupabaseAdminClient: async () => {
        serviceReads++;
        return { from() { return {
          select() { return this; }, eq() { return this; },
          async order() { return { data: [], error: readError }; },
          async maybeSingle() { return { data: missing || readError ? null : { status: "draft", content: "", blog_post_tags: [], project_tags: [], project_images: [] }, error: readError }; },
        }; } };
      } };
      if (name === "next/navigation") return { redirect(destination) { throw new Error(`redirect:${destination}`); }, notFound() { throw new Error("not-found"); } };
      if (name === "next/link") return { __esModule: true, default: () => null };
      if (name === "@/app/components/admin/BlogForm") return { BlogForm: () => null };
      if (name === "@/app/components/admin/ProjectForm") return { ProjectForm: () => null };
      return require(name);
    },
  });
  const page = exports.default;
  return { render: () => page(path.includes("[id]") ? { params: Promise.resolve({ id }) } : undefined), serviceReads: () => serviceReads };
}

function collect(node, predicate) {
  if (node == null || typeof node !== "object") return [];
  const found = predicate(node) ? [node] : [];
  const children = node.props?.children;
  return found.concat(...(Array.isArray(children) ? children : [children]).map((child) => collect(child, predicate)));
}

test("Admin editor pages deny anonymous and non-owner reads before creating a service client", async () => {
  for (const path of paths) {
    for (const [status, destination] of [[401, "/admin/login"], [403, "/"]]) {
      const target = pageFor(path, { deniedStatus: status });
      await assert.rejects(target.render(), (error) => error.message === `redirect:${destination}`, `${path}: ${status}`);
      assert.equal(target.serviceReads(), 0, `${path}: ${status}`);
    }
  }
});

test("failed editor reads provide recovery rather than a false missing-record page", async () => {
  for (const path of paths) {
    const target = pageFor(path, { readError: { code: "XX000" } });
    const result = await target.render();
    assert.equal(collect(result, (element) => element.props?.role === "alert").length, 1, path);
    assert.ok(collect(result, (element) => element.props?.href?.includes("retry=")).length, path);
  }
});

test("a genuinely missing Blog post stays a 404", async () => {
  await assert.rejects(pageFor("blogs/[id]/page.tsx", { missing: true }).render(), /not-found/);
});
