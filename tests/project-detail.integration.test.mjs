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
    if (!html.includes("At a glance")) {
      // The dev server can stream a loading shell while another route sweep is compiling.
      html = await (await fetch(`${baseUrl}/projects/${slug}`)).text();
    }
    assert.ok(html.includes("Share project"), `${slug} should render sharing`);
    assert.ok(html.includes("At a glance"), `${slug} should render its facts`);
    assert.doesNotMatch(html, /Preview-only case study\.|Case study \/ /, slug);
    const facts = [...html.matchAll(/<dt[^>]*>(Built|Stage|Visit|Latest update|Source|Type)<\/dt>/g)].map((match) => match[1]);
    assert.deepEqual(facts, ["Built", "Visit", "Latest update", "Source"], slug);
    assert.match(html, /<dt[^>]*>Category<\/dt>/, slug);
    assert.match(html, /<dt[^>]*>Tags<\/dt>/, slug);
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

test("project category, timeline, source name and optional sections remain owner-managed", async () => {
  const [migration, page, detail, api, form, index, filters] = await Promise.all([
    readFile(new URL("../migrations/2026_project_case_studies.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/ProjectsIndex.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /ADD COLUMN IF NOT EXISTS latest_update_label text/);
  assert.match(migration, /case_study_sections jsonb/);
  assert.match(migration, /live_note text/);
  assert.match(migration, /source_note text/);
  assert.match(api, /category: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(60\)/);
  assert.doesNotMatch(api, /project_stage/);
  assert.match(api, /tagline: z\.string\(\)\.max\(160\)/);
  assert.match(api, /latest_update_label: data\.latest_update_label/);
  assert.doesNotMatch(api, /live_note: data\.live_note/);
  assert.match(api, /source_note: data\.source_note/);
  assert.match(api, /projectWriteError\(error\)/);
  assert.match(api, /2026_project_case_studies\.sql before changes can be saved/);
  assert.match(api, /case_study_sections: data\.case_study_sections/);
  assert.match(form, /register\("latest_update_label"\)/);
  assert.doesNotMatch(form, /register\("project_stage"\)/);
  assert.doesNotMatch(form, /register\("live_note"\)/);
  assert.match(form, /register\("source_note"\)/);
  assert.match(form, /register\(`case_study_sections\.\$\{key\}`\)/);
  assert.match(page, /item\.tags\.filter/);
  assert.doesNotMatch(detail, /<Fact label="Stage">|<Fact label="Type">/);
  assert.match(detail, /<Fact label="Category">/);
  assert.match(detail, /domainTags\.map/);
  assert.match(api, /tags: z\.array\(z\.string\(\)\.trim\(\)\.min\(1\)\.max\(100\)\)\.optional/);
  assert.match(index, /tags: Array\.isArray\(p\.tags\) \? p\.tags : \[\]/);
  assert.match(filters, /filterTags\(p\)\.includes\(activeTag\)/);
  assert.match(filters, /\.\.\.filterTags\(p\)/);
  assert.match(detail, /<Fact label="Latest update">/);
  assert.match(detail, /project\.live_url \?/);
  assert.match(detail, /sourceUrl \?/);
  assert.match(detail, /project\.sourceNote \|\| \(project\.isPreview/);
  assert.match(detail, /sections\.map/);
  assert.match(detail, /Related projects/);
  assert.match(detail, /Browse all projects/);
  for (const action of ["Copy URL", "View as Markdown", "Open in ChatGPT", "Open in Claude"]) {
    assert.ok(detail.includes(action), `share menu should include ${action}`);
  }
  assert.doesNotMatch(detail, /Copy as Markdown|Share by email/);
  assert.match(page, /fetchProjects\(\)\.catch\(\(\) => \[\]\)/);
});

test("Alloy preview gives every published project a distinct, complete example without changing structured data", {
  skip: process.env.PROJECTS_EXPECT_PREVIEW !== "1",
}, async () => {
  const fixtureSource = await readFile(new URL("../app/data/project-preview-fixtures.ts", import.meta.url), "utf8");
  const slugs = [...fixtureSource.matchAll(/^  "([a-z0-9-]+)": \{/gm)].map((match) => match[1]);
  assert.equal(slugs.length, 10);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.match(fixtureSource, /process\.env\.NODE_ENV !== "development"/);
  assert.match(fixtureSource, /process\.env\.IS_ALLOY !== "true"/);
  assert.match(fixtureSource, /process\.env\.PROJECT_DETAIL_PREVIEW_SEED === "false"/);

  const categories = new Set();
  const summaries = new Set();
  for (const slug of slugs) {
    const response = await fetch(`${baseUrl}/projects/${slug}`);
    assert.equal(response.status, 200, slug);
    let html = await response.text();
    if (!html.includes("Why I built this")) {
      // ISR/dev compilation can stream a loading shell on the first response.
      html = await (await fetch(`${baseUrl}/projects/${slug}`)).text();
    }
    assert.doesNotMatch(html, /Preview-only case study\.|Case study \/ /, slug);
    assert.ok(html.includes("noindex,nofollow"), slug);
    for (const heading of ["Overview", "Why I built this", "Highlights", "Key decisions", "Results", "What I learned", "Gallery"]) {
      assert.ok(html.includes(`>${heading}</h2>`), `${slug} should have ${heading}`);
    }
    assert.ok(html.includes("Latest update"), slug);
    assert.doesNotMatch(html, /<dt[^>]*>Stage<\/dt>/, slug);
    assert.ok(html.includes("preview stock image, not a project screenshot"), slug);
    assert.ok((html.match(/<figcaption/g) || []).length >= 2, `${slug} needs at least two captioned preview images`);
    const category = html.match(/<dt[^>]*>Category<\/dt><dd[^>]*>([^<]+)<\/dd>/)?.[1];
    const summary = html.match(/<h1[^>]*>[^<]+<\/h1><p[^>]*>([^<]+)<\/p>/)?.[1];
    assert.ok(category, `${slug} needs a category`);
    assert.ok(summary, `${slug} needs a summary`);
    categories.add(category);
    summaries.add(summary);
    const structuredData = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
      .map((match) => match[1]).find((value) => value.includes("CreativeWork"));
    assert.ok(structuredData, `${slug} needs structured data`);
    assert.doesNotMatch(structuredData, /example\.com|octocat/);
  }
  assert.equal(categories.size, slugs.length);
  assert.equal(summaries.size, slugs.length);
});
