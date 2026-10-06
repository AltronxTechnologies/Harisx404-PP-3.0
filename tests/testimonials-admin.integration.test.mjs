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
