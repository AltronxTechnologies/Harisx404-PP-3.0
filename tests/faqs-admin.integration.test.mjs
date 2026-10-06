import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("FAQ Admin methods reject anonymous requests and section updates target one settings row", async () => {
  const api = await source("app/api/admin/faqs/route.ts");
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    const response = await fetch(`${base}/api/admin/faqs`, { method });
    assert.equal(response.status, 401, `${method} must check Admin before database access`);
  }
  assert.match(api, /\.from\("site_settings"\)\s*\.select\("id"\)\s*\.limit\(2\)/);
  assert.match(api, /settings\?\.length !== 1/);
  assert.match(api, /\.eq\("id", settings\[0\]\.id\)/);
  assert.doesNotMatch(api, /\.not\("id", "is", null\)/);
  assert.match(api, /if \(!deleted\) return NextResponse\.json/);
});

test("FAQ list and editor preserve visible states, accessible controls and bounded validation", async () => {
  const [list, form, toggles, deletion, edit] = await Promise.all([
    source("app/admin/(dashboard)/faqs/page.tsx"),
    source("app/components/admin/FaqForm.tsx"),
    source("app/components/admin/FaqToggles.tsx"),
    source("app/components/admin/DeleteFaqButton.tsx"),
    source("app/admin/(dashboard)/faqs/[id]/page.tsx"),
  ]);
  assert.match(list, /grid min-w-0 gap-3 xl:hidden/);
  assert.match(list, /xl:block/);
  assert.match(list, /settings\?\.length === 1/);
  assert.match(list, /FAQ section visibility could not be loaded/);
  assert.match(list, /FAQs could not be loaded/);
  assert.match(form, /z\.string\(\)\.trim\(\)\.min\(1/);
  assert.match(form, /value === "" \? NaN : Number\(value\)/);
  assert.match(form, /Discard unsaved FAQ changes/);
  assert.match(toggles, /aria-checked=\{enabled\}/);
  assert.match(toggles, /min-h-11/);
  assert.match(deletion, /confirmText="DELETE"/);
  assert.match(edit, /This FAQ could not be loaded/);
});
