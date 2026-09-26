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
    assert.deepEqual(facts, ["Built", "Latest update", "Visit", "Source"], slug);
    assert.match(html, /<dt[^>]*>Category<\/dt><dd[^>]*><span[^>]*><span[^>]*rounded-full/, slug);
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

test("project images enforce a cover, allow ordered additions, and deliver responsive WebP", async () => {
  const [form, picker, upload, api, detail, carousel, fixture, compose] = await Promise.all([
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/MediaPickerModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/media/upload/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectImageCarousel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/project-preview-fixtures.ts", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.alloy.yaml", import.meta.url), "utf8"),
  ]);

  assert.match(form, /Upload replacement/);
  assert.match(form, /setMediaPickerTab\("upload"\)/);
  assert.match(form, /Choose from library/);
  assert.match(form, /At least one image is required/);
  assert.match(form, /setValue\("cover_image_url", nextCover\.url/);
  assert.match(form, /do not delete shared media-library images/);
  assert.match(form, /setValue\("cover_image_id", media\.id/);
  assert.match(form, /Make cover \(first image\)/);
  assert.match(form, /Replace image/);
  assert.match(picker, /setActiveTab\(initialTab\)/);
  assert.match(api, /cover_image_id: data\.cover_image_id \|\| null/);
  assert.match(api, /cover_image_url: z\.string\(\)\.url\(\)/);
  assert.doesNotMatch(api, /gallery: z\.array\([^\n]+\.max\(100\)/);
  assert.match(upload, /auth\.getUser\(\)/);
  assert.match(upload, /ADMIN_EMAIL/);
  assert.match(upload, /createSupabaseAdminClient\(\)/);
  assert.doesNotMatch(upload, /10_000_000/);
  assert.match(detail, /<ProjectImageCarousel images=\{images\}/);
  assert.doesNotMatch(detail, /title: "Gallery"/);
  assert.match(carousel, /f_webp,q_auto:good,c_limit,w_/);
  assert.match(carousel, /object-contain/);
  assert.match(carousel, /drag=\{images\.length > 1/);
  assert.match(carousel, /aspect-\[4\/3\].*sm:aspect-video/);
  assert.match(carousel, /className="pointer-events-none select-none object-cover"/);
  assert.match(carousel, /aria-label=\{`Open image \$\{shownIndex \+ 1\} in full screen`\}/);
  assert.doesNotMatch(carousel, /View image<\/span>|<Expand/);
  assert.match(carousel, /<figcaption aria-live="polite"/);
  assert.match(carousel, /className="flex h-14 items-center border-t border-border-primary bg-neutral-100/);
  assert.match(carousel, /className="min-w-0 truncate"/);
  assert.doesNotMatch(carousel, /<figcaption[^>]*>[\s\S]*?<span[^>]*>\{shownIndex \+ 1\} \/ \{images\.length\}/);
  assert.match(carousel, /aria-label="Carousel controls"/);
  assert.match(carousel, /mt-8 flex flex-wrap items-center justify-center gap-4/);
  assert.match(carousel, /order-1 flex w-full max-w-\[70vw\] flex-wrap items-center justify-center sm:order-none sm:w-auto/);
  assert.match(carousel, /w-14/);
  assert.match(carousel, /w-7/);
  assert.match(carousel, /bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500/);
  assert.match(carousel, /transition=\{canPlay \? \{ duration: 5, ease: "linear" \} : \{ duration: 0 \}\}/);
  assert.doesNotMatch(carousel, /w-\[60vw\]|gridTemplateColumns/);
  assert.match(carousel, /className=\{`\$\{controlClass\} order-2 sm:order-none`\}/);
  assert.match(carousel, /aria-label="Previous image"/);
  assert.match(carousel, /aria-label="Next image"/);
  assert.match(carousel, /createPortal\(/);
  assert.match(carousel, /aria-modal="true"/);
  assert.match(carousel, /event\.key === "Escape"/);
  assert.match(carousel, /event\.key === "ArrowRight" \|\| event\.key === "ArrowLeft"/);
  assert.match(carousel, /node\.inert = true/);
  assert.match(carousel, /requestAnimationFrame\(\(\) => opener\?\.focus\(\)\)/);
  assert.match(carousel, /touch-pan-y/);
  assert.match(carousel, /entry\.intersectionRatio >= 0\.35/);
  assert.match(carousel, /visibilitychange/);
  assert.match(carousel, /onLoad=\{\(\) => \{ if \(wantedSrcRef\.current === current\.src\)/);
  assert.match(carousel, /type="range" min=\{1\} max=\{4\} step=\{0\.25\}/);
  assert.match(carousel, /sizes=\{zoomed \? "\(max-width: 640px\) 1080px, 1920px" : "100vw"\}/);
  assert.doesNotMatch(carousel, /bg-bg-primary\/95|flex-1 truncate text-xs/);
  assert.match(fixture, /portraitPhoto\(cover_photo\)/);
  assert.match(compose, /CLOUDINARY_API_SECRET: \$\{CLOUDINARY_API_SECRET:-\}/);

  const response = await fetch(`${baseUrl}/api/admin/media/upload`, { method: "POST" });
  assert.equal(response.status, 401);
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
  assert.match(detail, /project\.gallery\.filter/);
  assert.match(detail, /<ProjectImageCarousel/);
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
  assert.match(detail, /project\.category\.split\(\/\\s\+\\\/\\s\+\|,\//);
  assert.ok((detail.match(/font-mono text-xs font-semibold uppercase tracking-widest/g) || []).length >= 4);
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
    for (const heading of ["Overview", "Why I built this", "Highlights", "Key decisions", "Results", "What I learned"]) {
      assert.ok(html.includes(`>${heading}</h2>`), `${slug} should have ${heading}`);
    }
    assert.doesNotMatch(html, />Gallery<\/h2>/, slug);
    assert.match(html, /aria-label="[^"]+ images"/, `${slug} needs the image carousel`);
    assert.ok(html.includes("Latest update"), slug);
    assert.doesNotMatch(html, /<dt[^>]*>Stage<\/dt>/, slug);
    assert.ok(html.includes("preview stock image, not a project screenshot"), slug);
    assert.match(html, /aria-label="Image 1 of [2-9][0-9]*"/, `${slug} needs a cover followed by preview images`);
    const categoryHtml = html.match(/<dt[^>]*>Category<\/dt><dd[^>]*>(.*?)<\/dd>/s)?.[1];
    const categoryPills = [...(categoryHtml || "").matchAll(/<span[^>]*rounded-full[^>]*>([^<]+)<\/span>/g)].map((match) => match[1]);
    const summary = html.match(/<h1[^>]*>[^<]+<\/h1><p[^>]*>([^<]+)<\/p>/)?.[1];
    assert.ok(categoryPills.length > 0, `${slug} needs category pills`);
    if (slug === "demo-sentimentscope-nlp") assert.deepEqual(categoryPills, ["AI/ML", "Language Processing"]);
    assert.ok(summary, `${slug} needs a summary`);
    categories.add(categoryPills.join(" / "));
    summaries.add(summary);
    const structuredData = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
      .map((match) => match[1]).find((value) => value.includes("CreativeWork"));
    assert.ok(structuredData, `${slug} needs structured data`);
    assert.doesNotMatch(structuredData, /example\.com|octocat/);
  }
  assert.equal(categories.size, slugs.length);
  assert.equal(summaries.size, slugs.length);
});
