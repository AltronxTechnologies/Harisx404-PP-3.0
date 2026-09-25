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
    if (!html.includes("Preview-only case study")) {
      // ISR/dev compilation can stream a loading shell on the first response.
      html = await (await fetch(`${baseUrl}/projects/${slug}`)).text();
    }
    assert.ok(html.includes("Preview-only case study"), slug);
    assert.ok(html.includes("noindex,nofollow"), slug);
    for (const heading of ["Overview", "Why I built this", "Highlights", "Key decisions", "Results", "What I learned", "Gallery"]) {
      assert.ok(html.includes(`>${heading}</h2>`), `${slug} should have ${heading}`);
    }
    assert.ok(html.includes("Latest update"), slug);
    assert.ok(html.includes("preview stock image, not a project screenshot"), slug);
    assert.ok((html.match(/<figcaption/g) || []).length >= 2, `${slug} needs at least two captioned preview images`);
    const category = html.match(/Case study \/ (?:<!-- -->)?([^<]+)<\/p>/)?.[1];
    const summary = html.match(/<h1[^>]*>[^<]+<\/h1><p[^>]*>([^<]+)<\/p>/)?.[1];
    assert.ok(category, `${slug} needs a project type`);
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
