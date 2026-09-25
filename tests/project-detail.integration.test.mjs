import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PROJECTS_BASE_URL || "http://localhost:3000";

test("published project cards resolve to authored detail pages", async () => {
  const index = await fetch(`${baseUrl}/projects`);
  assert.equal(index.status, 200);
  const slugs = [...(await index.text()).matchAll(/href="\/projects\/([a-z0-9-]+)"/g)]
    .map((match) => match[1]);
  const uniqueSlugs = [...new Set(slugs)];
  assert.ok(uniqueSlugs.length > 0, "the projects index should link to published projects");

  for (const slug of uniqueSlugs) {
    const response = await fetch(`${baseUrl}/projects/${slug}`);
    assert.equal(response.status, 200, slug);
    let html = await response.text();
    if (!html.includes("Case study / ")) {
      // The dev server can stream a loading shell while another route sweep is compiling.
      html = await (await fetch(`${baseUrl}/projects/${slug}`)).text();
    }
    assert.ok(html.includes("Case study / "), `${slug} should render its case study`);
    assert.ok(html.includes("Share project"), `${slug} should render sharing`);
    assert.ok(html.includes("At a glance"), `${slug} should render its facts`);
    assert.ok(html.includes("Visit"), `${slug} should explain live availability`);
    assert.ok(html.includes("Source"), `${slug} should explain source availability`);
    assert.ok(html.includes("<h1"), `${slug} should render a heading`);
    assert.doesNotMatch(html, /Why I Built This|Key Decisions|Performance-first build: optimized images/, slug);
  }
});

test("unknown projects remain unindexable and do not display a case study", async () => {
  const response = await fetch(`${baseUrl}/projects/not-a-published-project-9d21a`);
  const html = await response.text();
  assert.match(html, /Project Not Found/);
  assert.match(html, /noindex/);
  assert.doesNotMatch(html, /Share project|At a glance/);
});

test("project mutations reject unauthenticated requests", async () => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/projects`, { method });
    assert.equal(response.status, 401, method);
  }
});

test("project gallery and narrative are sourced from Admin-authored data", async () => {
  const [page, detail, publicData, api, form] = await Promise.all([
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/utils.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /getProjectBySlug\(slug\)/);
  assert.match(page, /Array\.isArray\(p\.galleryDetails\)/);
  assert.doesNotMatch(page, /genericFeatures|formatQuarter/);
  assert.match(detail, /<ReactMarkdown/);
  assert.match(detail, /image\.alt \|\| image\.caption/);
  assert.doesNotMatch(detail, /dangerouslySetInnerHTML/);
  assert.match(publicData, /project_images \( display_order, caption, media \( secure_url, url, alt_text \) \)/);
  assert.match(api, /auth\.getUser\(\)/);
  assert.match(api, /ADMIN_EMAIL/);
  assert.match(api, /await validateGalleryMedia/);
  assert.match(form, /galleryImages\.map\(\(\{ mediaId, caption \}\)/);
});

test("project type, timeline and optional sections remain owner-managed", async () => {
  const [migration, page, detail, api, form] = await Promise.all([
    readFile(new URL("../migrations/2026_project_case_studies.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /ADD COLUMN IF NOT EXISTS latest_update_label text/);
  assert.match(migration, /case_study_sections jsonb/);
  assert.match(migration, /live_note text/);
  assert.match(migration, /source_note text/);
  assert.match(api, /category: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(60\)/);
  assert.match(api, /tagline: z\.string\(\)\.max\(160\)/);
  assert.match(api, /latest_update_label: data\.latest_update_label/);
  assert.match(api, /live_note: data\.live_note/);
  assert.match(api, /source_note: data\.source_note/);
  assert.match(api, /projectWriteError\(error\)/);
  assert.match(api, /2026_project_case_studies\.sql before changes can be saved/);
  assert.match(api, /case_study_sections: data\.case_study_sections/);
  assert.match(form, /register\("latest_update_label"\)/);
  assert.match(form, /register\("live_note"\)/);
  assert.match(form, /register\("source_note"\)/);
  assert.match(form, /register\(`case_study_sections\.\$\{key\}`\)/);
  assert.match(page, /item\.tags\.filter/);
  assert.match(detail, /project\.latestUpdate &&/);
  assert.match(detail, /project\.live_url \?/);
  assert.match(detail, /sourceUrl \?/);
  assert.match(detail, /sections\.map/);
  assert.match(detail, /Related projects/);
  assert.match(detail, /Browse all projects/);
  for (const action of ["Copy URL", "Copy as Markdown", "View as Markdown", "Open in ChatGPT", "Open in Claude", "Share by email"]) {
    assert.ok(detail.includes(action), `share menu should include ${action}`);
  }
  assert.match(page, /fetchProjects\(\)\.catch\(\(\) => \[\]\)/);
});
