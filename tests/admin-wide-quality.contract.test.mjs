import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin settings, alerts and logs do not report invalid or partial state as success", async () => {
  const [settings, settingsApi, faqApi, testimonialApi, logs, dashboard] = await Promise.all([
    source("app/admin/(dashboard)/settings/page.tsx"),
    source("app/api/admin/settings/route.ts"),
    source("app/api/admin/faqs/route.ts"),
    source("app/api/admin/testimonials/route.ts"),
    source("app/admin/(dashboard)/logs/page.tsx"),
    source("app/admin/(dashboard)/page.tsx"),
  ]);
  for (const field of ["site_name", "seo_description", "github_url", "twitter_url", "linkedin_url", "email_address"]) {
    assert.match(settings, new RegExp(`errorProps\\("${field}"\\)`));
    assert.match(settings, new RegExp(`<FieldError name="${field}"`));
  }
  assert.doesNotMatch(settings, /register\("seo_keywords"\)/);
  assert.match(settingsApi, /seo_keywords: z\.string\(\)\.trim\(\)\.max\(500\)\.optional\(\)/);
  assert.match(settings, /useAdminNavigationGuard\(isDirty\)/);
  assert.match(settings, /readAdminResponse\(res, "Site settings"\)/);
  assert.match(settingsApi, /fields: parsed\.error\.flatten\(\)\.fieldErrors/);
  assert.match(faqApi, /The FAQ change was saved, but the homepage cache could not be refreshed/);
  assert.match(testimonialApi, /Testimonial was saved, but the homepage cache could not be refreshed/);
  assert.match(logs, /count: "exact", head: true/);
  assert.match(dashboard, /Some dashboard totals are unavailable/);
});

test("Admin navigation, media references and project bounds protect unsaved or mismatched data", async () => {
  const [guard, blog, project, projectApi, media, picker, datePicker, experienceApi] = await Promise.all([
    source("app/components/admin/useAdminNavigationGuard.ts"),
    source("app/components/admin/BlogForm.tsx"),
    source("app/components/admin/ProjectForm.tsx"),
    source("app/api/admin/projects/route.ts"),
    source("app/lib/admin/delete-media.ts"),
    source("app/components/admin/MediaPickerModal.tsx"),
    source("app/components/admin/BlogDatePicker.tsx"),
    source("app/api/admin/experience/route.ts"),
  ]);
  assert.match(guard, /setLeaveTarget\("__signout__"\)/);
  assert.match(guard, /button\?\.getAttribute\("aria-label"\) === "Sign Out"/);
  assert.match(guard, /window\.history\.pushState/);
  assert.match(blog, /useAdminNavigationGuard\(isDirty \|\| Boolean\(tagInput\.trim\(\)\) \|\| isUploadingImages\)/);
  assert.match(project, /useAdminNavigationGuard\(isDirty \|\| galleryDirty \|\| stagedImages\.length > 0/);
  assert.match(project, /<BuildlogSelect id="project-stage"/);
  assert.match(project, /<BuildlogSelect id="project-status"/);
  assert.match(projectApi, /\.max\(32\)\.optional\(\)\.default\(\[\]\)/);
  assert.match(projectApi, /\.max\(20\)\.optional\(\)\.default\(\[\]\)/);
  assert.match(media, /"testimonials", \["avatar_url"\]/);
  assert.match(media, /"experience", \["logo_url"\]/);
  assert.match(media, /"certifications", \["issuer_logo_url", "badge_image_url"\]/);
  assert.match(picker, /onSelect\(selected\) === false/);
  assert.match(datePicker, /overflow-x-auto/);
  assert.match(experienceApi, /\.select\("start_month, start_year, end_month, end_year, is_current"\)/);
});
