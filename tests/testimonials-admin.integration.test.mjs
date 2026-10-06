import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Testimonial Admin API verifies ownership before every service-role request", async () => {
  const route = await source("app/api/admin/testimonials/route.ts");
  assert.equal((route.match(/await requireAdmin\(\)/g) || []).length, 4);
  assert.match(route, /if \(!deleted\) return NextResponse\.json\(\{ error: "Testimonial not found/);
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const section = route.slice(route.indexOf(`export async function ${method}(`));
    assert.ok(section.indexOf("if (auth.response) return auth.response") < section.indexOf("createSupabaseAdminClient()"));
    const response = await fetch(`${base}/api/admin/testimonials`, { method });
    assert.equal(response.status, 401, `anonymous ${method} must be denied before any DB read or write`);
  }
});

test("Testimonial Admin writes reject untrusted fields and malformed requests before service-role access", async () => {
  const route = await source("app/api/admin/testimonials/route.ts");
  const fields = route.slice(route.indexOf("const fields ="), route.indexOf("const updateSchema ="));
  assert.match(fields, /headline: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(70\)/);
  assert.match(fields, /quote: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(280\)/);
  assert.match(fields, /name: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(80\)/);
  assert.match(fields, /role: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(80\)\.nullable\(\)\.optional\(\)/);
  assert.match(fields, /display_order: z\.number\(\)\.int\(\)/);
  assert.match(fields, /status: z\.enum\(\["pending", "draft", "published", "archived"\]\)/);
  assert.match(fields, /\}\)\.strict\(\)/);
  assert.doesNotMatch(fields, /\b(email|source|created_at|id):/);
  assert.match(route, /const avatarUrl = z\.string\(\)\.trim\(\)\.max\(2048\)\.refine/);
  assert.match(route, /url\.protocol === "https:" && !!url\.hostname && !url\.username && !url\.password/);
  assert.match(route, /const updateSchema = fields\.partial\(\)\.extend\(\{ id: idSchema \}\)\.strict\(\)/);
  assert.match(route, /Object\.keys\(value\)\.length > 1/);
  assert.doesNotMatch(route, /pickWritable|\.insert\(\[data\]\)|\.update\(data\)/);

  for (const [method, next] of [["POST", "PUT"], ["PUT", "DELETE"]]) {
    const section = route.slice(route.indexOf(`export async function ${method}(`), route.indexOf(`export async function ${next}(`));
    assert.match(section, new RegExp(`const parsed = ${method === "POST" ? "fields" : "updateSchema"}\\.safeParse\\(await request\\.json\\(\\)\\.catch\\(\\(\\) => null\\)\\)`));
    assert.ok(section.indexOf("if (!parsed.success)") < section.indexOf("createSupabaseAdminClient()"));
    assert.match(section, /status: 400/);
    assert.match(section, /return failure\(error\)/);
  }
  assert.match(route, /\.update\(changes\)/);
  assert.match(route, /\.insert\(\[parsed\.data\]\)/);
  const deletion = route.slice(route.indexOf("export async function DELETE("));
  assert.ok(deletion.indexOf("idSchema.safeParse(id)") < deletion.indexOf("createSupabaseAdminClient()"));
  assert.match(route, /if \(!testimonial\) return NextResponse\.json\(\{ error: "Testimonial not found/);
  assert.match(route, /status: 503/);
  assert.doesNotMatch(route, /\{ error: err\.message \}/);
});

test("Testimonial edit gates service-role reads and distinguishes missing rows from read failures", async () => {
  const page = await source("app/admin/(dashboard)/testimonials/[id]/page.tsx");
  assert.ok(page.indexOf("requireAdmin()") < page.indexOf("createSupabaseAdminClient()"));
  assert.ok(page.indexOf("if (auth.response) redirect(") < page.indexOf("createSupabaseAdminClient()"));
  assert.ok(page.indexOf("z.string().uuid().safeParse(id)") < page.indexOf("createSupabaseAdminClient()"));
  assert.match(page, /\.maybeSingle\(\)/);
  assert.match(page, /if \(error\) throw error/);
  assert.match(page, /catch \(error\) \{[\s\S]*?return <div role="alert"/);
  assert.match(page, /Retry loading/);
  assert.match(page, /if \(!testimonial\) notFound\(\)/);
});

test("Testimonial moderation remains separate from the published-only public collection", async () => {
  const [list, actions, deletion, form, publicAction] = await Promise.all([
    source("app/admin/(dashboard)/testimonials/page.tsx"),
    source("app/components/admin/TestimonialModerationActions.tsx"),
    source("app/components/admin/DeleteTestimonialButton.tsx"),
    source("app/components/admin/TestimonialForm.tsx"),
    source("app/lib/testimonial-actions.ts"),
  ]);
  assert.ok(list.indexOf("requireAdmin()") < list.indexOf("createSupabaseAdminClient()"));
  assert.match(list, /Testimonials could not be loaded/);
  assert.match(list, /flex w-full flex-wrap items-center gap-2 sm:w-auto/);
  assert.match(actions, /<AdminConfirmDialog/);
  assert.match(actions, /min-h-11/);
  assert.match(deletion, /confirmText="DELETE"/);
  assert.match(deletion, /size-11/);
  assert.match(form, /Choose avatar from Media Library/);
  assert.match(form, /readAdminResponse\(res, "Testimonial"\)/);
  assert.match(publicAction, /status: "pending"/);
});
