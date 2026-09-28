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
    const facts = [...html.matchAll(/<dt[^>]*>(Built|Stage|Expected completion|Visit|Latest update|Source|Type)<\/dt>/g)].map((match) => match[1]);
    assert.deepEqual(facts, facts[0] === "Stage" ? ["Stage", "Expected completion", "Visit", "Source"] : ["Built", "Latest update", "Visit", "Source"], slug);
    assert.doesNotMatch(html, /Category &amp; tags|<dt[^>]*>Category<\/dt>|<dt[^>]*>Tags<\/dt>/, slug);
    assert.match(html, />Tech stack<\/h2>/, slug);
    assert.match(html, />Tags<\/h2>/, slug);
    assert.ok(html.includes("<h1"), `${slug} should render a heading`);
    assert.doesNotMatch(html, /Why I Built This|Key Decisions|Performance-first build: optimized images/, slug);
  }
});

test("unknown projects remain unindexable and do not display a case study", async () => {
  const response = await fetch(`${baseUrl}/projects/not-a-published-project-9d21a`);
  const html = await response.text();
  assert.equal(response.status, 404);
  assert.match(html, /This page wandered/);
  assert.match(html, /noindex/);
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  assert.doesNotMatch(html, /Share project|At a glance/);
});

test("project mutations reject unauthenticated requests", async () => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/projects`, { method });
    assert.equal(response.status, 401, method);
  }
});

test("project README generation requires an Admin account before external calls", async () => {
  const routes = await Promise.all([
    readFile(new URL("../app/api/ai/project-from-github/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/ai/assist/route.ts", import.meta.url), "utf8"),
  ]);
  for (const route of routes) {
    assert.match(route, /supabase\.auth\.getUser\(\)/);
    assert.match(route, /process\.env\.ADMIN_EMAIL\?\.trim\(\)\.toLowerCase\(\)/);
    assert.match(route, /user\.email\?\.trim\(\)\.toLowerCase\(\) !== adminEmail/);
  }
  assert.ok(routes[0].indexOf("user.email?.trim().toLowerCase() !== adminEmail") < routes[0].indexOf("fetch(`https://api.github.com"));
  assert.equal((await fetch(`${baseUrl}/api/ai/project-from-github`, { method: "POST" })).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/ai/assist`, { method: "POST" })).status, 401);
});

test("project saves use a transactional RPC and reject stale edits", async () => {
  const [api, form, migration] = await Promise.all([
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_project_admin_atomic_save.sql", import.meta.url), "utf8"),
  ]);
  assert.match(api, /db\.rpc\("save_project_with_gallery_and_tags"/);
  assert.match(api, /db\.rpc\("delete_project_and_unlink_related"/);
  assert.match(api, /updated_at: z\.string\(\)\.datetime\(\{ offset: true \}\)/);
  assert.match(form, /updated_at: initialData\.updated_at/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /PROJECT_CONFLICT/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.save_project_with_gallery_and_tags/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.delete_project_and_unlink_related/);
  assert.doesNotMatch(api, /function saveGallery|await syncTags/);
  assert.doesNotMatch(api, /db\.from\("projects"\)\.delete\(\)/);
});

test("project images enforce a cover, allow ordered additions, and deliver responsive WebP", async () => {
  const [form, picker, upload, api, detail, carousel, page, fixture, compose, captions] = await Promise.all([
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/MediaPickerModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/media/upload/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectImageCarousel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/project-preview-fixtures.ts", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.alloy.yaml", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/project-captions.ts", import.meta.url), "utf8"),
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
  assert.match(form, /register\("case_study_sections\.cover_caption"\)/);
  assert.match(form, /maxLength=\{200\}/);
  assert.match(form, /\.slice\(0, 200\)/);
  assert.match(form, /setValue\("case_study_sections\.cover_caption", nextCover\.caption/);
  assert.match(picker, /setActiveTab\(initialTab\)/);
  assert.match(picker, /aria-label="Close media picker"/);
  assert.match(picker, /document\.addEventListener\("keydown", onKeyDown\)/);
  assert.match(picker, /previousFocus\.focus\(\)/);
  assert.match(picker, /type="file" className="sr-only"/);
  assert.match(api, /cover_image_id: data\.cover_image_id \|\| null/);
  assert.match(api, /cover_image_url: z\.string\(\)\.url\(\)/);
  assert.match(api, /cover_caption: z\.string\(\)\.max\(200\)\.refine\(\(caption\) => captionWordCount\(caption\) <= 30/);
  assert.match(api, /caption: z\.string\(\)\.max\(200\)/);
  assert.match(api, /captionWordCount\(value\) <= 30/);
  assert.match(form, /captionWordCount\(image\.caption\) > 30/);
  assert.match(form, /captionWordCount\(coverCaption\)/);
  assert.match(captions, /text\.split\(\/\\s\+\/u\)\.length/);
  assert.doesNotMatch(api, /gallery: z\.array\([^\n]+\.max\(100\)/);
  assert.match(upload, /auth\.getUser\(\)/);
  assert.match(upload, /ADMIN_EMAIL/);
  assert.match(upload, /createSupabaseAdminClient\(\)/);
  assert.doesNotMatch(upload, /10_000_000/);
  assert.match(detail, /<ProjectImageCarousel images=\{images\}/);
  assert.doesNotMatch(detail, /title: "Gallery"/);
  assert.match(carousel, /f_webp,q_auto:good,c_limit,w_/);
  assert.match(carousel, /drag=\{images\.length > 1/);
  assert.match(carousel, /className="relative aspect-\[3\/2\] overflow-hidden/);
  assert.doesNotMatch(carousel, /aspect-\[4\/3\]/);
  assert.match(carousel, /custom=\{direction\}/);
  assert.match(carousel, /exit="exit"/);
  assert.match(carousel, /pointer-events-none select-none object-cover \$\{imageError && !loading/);
  assert.match(carousel, /onError=\{\(\) => \{ if \(wantedSrcRef\.current === shown\.src\) setImageError\(true\)/);
  assert.match(carousel, /Image unavailable\.<\/span>/);
  assert.match(carousel, /Skip image<\/button>/);
  assert.doesNotMatch(carousel, /Open image|createPortal|data-project-image-viewer|ZoomIn|ZoomOut/);
  assert.doesNotMatch(carousel, /<figcaption/);
  assert.match(carousel, /<MessageSquareText/);
  assert.match(carousel, /aria-expanded=\{captionOpen\}/);
  assert.match(carousel, /role="region" aria-label="Image caption"/);
  assert.match(carousel, /border-border-primary bg-bg-primary text-text-primary shadow-xl/);
  assert.match(carousel, /aria-label="Close image caption"/);
  assert.match(carousel, /w-48 max-w-\[calc\(100%-1\.5rem\)\].*sm:w-72/);
  assert.doesNotMatch(carousel, /text-neutral-700 hover:bg-neutral-100/);
  assert.match(carousel, /document\.addEventListener\("pointerdown", onPointerDown\)/);
  assert.match(carousel, /captionButtonRef\.current\?\.contains\(target\)/);
  assert.match(carousel, /event\.key === "Escape"/);
  assert.match(carousel, /!paused && !captionOpen && !loading/);
  assert.match(detail, /caption: project\.coverCaption/);
  assert.match(page, /coverCaption: p\.case_study_sections\?\.cover_caption/);
  assert.match(carousel, /aria-label="Carousel controls"/);
  assert.match(carousel, /mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-4/);
  assert.match(carousel, /order-1 flex w-full flex-\[0_0_100%\] flex-wrap items-center justify-center sm:order-none sm:w-auto sm:max-w-\[70vw\]/);
  assert.match(carousel, /w-14/);
  assert.match(carousel, /w-7/);
  assert.match(carousel, /bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500/);
  assert.match(carousel, /transition=\{canPlay \? \{ duration: 5, ease: "linear" \} : \{ duration: 0 \}\}/);
  assert.match(carousel, /initial=\{\{ scaleX: canPlay \? 0 : 1 \}\} animate=\{\{ scaleX: 1 \}\}/);
  assert.doesNotMatch(carousel, /w-\[60vw\]|gridTemplateColumns/);
  assert.match(carousel, /className=\{`\$\{controlClass\} order-2 sm:order-none`\}/);
  assert.match(carousel, /aria-label="Previous image"/);
  assert.match(carousel, /aria-label="Next image"/);
  assert.doesNotMatch(carousel, /onMouseEnter|onMouseLeave|setHovered|setFocused/);
  assert.match(carousel, /visible && pageActive && !paused && !captionOpen && !loading/);
  assert.match(carousel, /entry\.intersectionRatio >= 0\.35/);
  assert.match(carousel, /visibilitychange/);
  assert.match(carousel, /readyUrlsRef\.current\.add\(current\.src\)/);
  assert.match(carousel, /adjacent\.map\(\(image\) => <Image/);
  assert.match(carousel, /window\.setTimeout\(\(\) => setShowLoading\(true\), 350\)/);
  assert.doesNotMatch(carousel, /bg-bg-primary\/95|flex-1 truncate text-xs/);
  assert.match(fixture, /portraitPhoto\(cover_photo\)/);
  assert.match(fixture, /Portrait stock reference - preview image, not a project screenshot/);
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
  assert.match(detail, /text-pretty text-\[15px\] leading-6 text-text-secondary \[overflow-wrap:anywhere\]/);
  assert.match(detail, /min-w-0 break-words text-\[15px\] leading-6 text-text-secondary \[overflow-wrap:anywhere\]/);
  assert.match(detail, /min-h-8 max-w-full items-center/);
  assert.doesNotMatch(detail, /aria-label="Breadcrumb"|aria-current="page"/);
  assert.match(detail, /prose max-w-none/);
  assert.match(detail, /\[&>:first-child\]:!mt-0 \[&>:last-child\]:!mb-0/);
  assert.match(detail, /grid gap-3 text-\[15px\]/);
  assert.match(detail, /grid gap-3 text-\[15px\] md:grid-cols-2/);
  assert.doesNotMatch(detail, /<ol className="[^"]*lg:grid-cols-1/);
  assert.match(detail, /aspect-\[16\/9\] overflow-hidden rounded-xl/);
  assert.match(detail, /title=\{item\.title\} className="block max-w-full truncate/);
  assert.match(detail, /item\.tagline && <span className="mt-3 line-clamp-2/);
  assert.doesNotMatch(detail, /<span className="font-mono text-\[11px\] uppercase tracking-widest text-text-secondary">\{item\.category\}<\/span>/);
  assert.match(detail, /View case study <ArrowUpRight/);
  assert.match(detail, /<article className="mt-14">/);
  assert.match(detail, /aria-labelledby="project-facts-heading" className="mx-auto mt-14 max-w-6xl px-2 sm:px-4"/);
  assert.match(detail, /<div className="rounded-3xl border border-border-primary bg-white dark:bg-white\/\[0\.02\]">/);
  assert.match(detail, /-mx-2 h-px bg-border-primary sm:-mx-3 lg:mx-0/);
  assert.match(detail, /<div className="mt-10"><SectionRule \/><\/div>/);
  assert.match(detail, /<ul className="my-5 list-disc space-y-2 pl-6">/);
  assert.match(detail, /<ol className="my-5 list-decimal space-y-2 pl-6">/);
  assert.match(detail, /<div className="mx-auto max-w-6xl px-2 sm:px-4">\s*<StorySection/);
  assert.match(detail, /grid lg:grid-cols-12/);
  assert.match(detail, /<div className="py-6 lg:col-span-3 lg:py-14">/);
  assert.match(detail, /hidden border-x border-dashed border-border-primary lg:col-span-1 lg:block/);
  assert.match(detail, /min-w-0 pb-10 lg:col-span-8 lg:pl-\[clamp\(16px,calc\(\(100vw-1186px\)\/2\),47px\)\] lg:py-14/);
  assert.match(detail, /project\.gallery\.filter/);
  assert.match(detail, /<ProjectImageCarousel/);
  assert.doesNotMatch(detail, /dangerouslySetInnerHTML/);
  assert.match(publicData, /project_images \( display_order, caption, alt_text, media \( secure_url, url, alt_text \) \)/);
  assert.match(publicData, /alt: pi\.alt_text \|\| pi\.caption \|\| ""/);
  assert.match(page, /coverAlt: p\.case_study_sections\?\.cover_alt/);
  assert.match(form, /register\("case_study_sections\.cover_alt"\)/);
  assert.match(form, /gallery-alt-\$\{image\.mediaId\}/);
  assert.match(api, /auth\.getUser\(\)/);
  assert.match(api, /ADMIN_EMAIL/);
  assert.match(api, /await validateGalleryMedia/);
  assert.match(form, /galleryImages\.map\(\(\{ mediaId, caption, altText \}\)/);
});

test("project tags, timeline, source name and optional sections remain owner-managed", async () => {
  const [migration, page, detail, api, form, editor, index, filters, cards] = await Promise.all([
    readFile(new URL("../migrations/2026_project_case_studies.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/TiptapEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/ProjectsIndex.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/home/CaseStudies.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /ADD COLUMN IF NOT EXISTS latest_update_label text/);
  assert.match(migration, /case_study_sections jsonb/);
  assert.match(migration, /live_note text/);
  assert.match(migration, /source_note text/);
  assert.match(api, /category: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(60\)/);
  assert.match(api, /project_stage: data\.project_stage/);
  assert.match(api, /tagline: z\.string\(\)\.max\(160\)/);
  assert.match(api, /latest_update_label: data\.latest_update_label/);
  assert.doesNotMatch(api, /live_note: data\.live_note/);
  assert.match(api, /source_note: data\.source_note/);
  assert.match(api, /projectWriteError\(error\)/);
  assert.match(api, /2026_project_case_studies\.sql before changes can be saved/);
  assert.match(api, /case_study_sections: data\.case_study_sections/);
  assert.match(form, /register\("latest_update_label"\)/);
  assert.match(form, /register\("project_stage"\)/);
  assert.doesNotMatch(form, /register\("live_note"\)/);
  assert.match(form, /register\("source_note"\)/);
  assert.match(form, /name=\{`case_study_sections\.\$\{key\}`\}/);
  assert.match(form, /<TiptapEditor label=\{label\} story value=\{field\.value \|\| ""\} onChange=\{field\.onChange\}/);
  assert.match(editor, /const MenuBar = \(\{ editor, story \}/);
  for (const action of ["toggleBold", "toggleItalic", "toggleBulletList", "toggleOrderedList"]) {
    assert.ok(editor.includes(`${action}()`), `${action} should be available in the story toolbar`);
  }
  assert.match(editor, /!story && \([\s\S]*?toggleHeading/);
  assert.match(editor, /markdown\.getMarkdown\(\)/);
  assert.match(detail, /\[&>\*\]:max-w-\[68ch\]/);
  assert.match(page, /item\.tags\.filter/);
  assert.match(detail, /<Fact label="Stage" alignMobileLabel>\{projectStageLabels\[project\.stage\]\}<\/Fact>/);
  assert.doesNotMatch(detail, /<Fact label="Type">/);
  assert.doesNotMatch(detail, /<Fact label="Category">|Category &amp; tags/);
  assert.match(detail, /<h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">Tags<\/h2>/);
  assert.match(detail, /<h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">Tech stack<\/h2>/);
  assert.ok((detail.match(/font-mono text-xs font-semibold uppercase tracking-widest/g) || []).length >= 4);
  assert.match(detail, /domainTags\.map/);
  assert.match(api, /tags: z\.array\(z\.string\(\)\.trim\(\)\.min\(1\)\.max\(100\)\)\.optional/);
  assert.match(index, /tags: Array\.isArray\(p\.tags\) \? p\.tags : \[\]/);
  assert.match(filters, /filterTags\(p\)\.includes\(activeTag\)/);
  assert.match(filters, /\.\.\.filterTags\(p\)/);
  assert.match(cards, /return clean\.length > 0 \? clean\.slice\(0, 3\)/);
  assert.match(cards, /h-\[26\.5px\] min-w-0 flex-wrap content-start items-center gap-2 overflow-hidden/);
  assert.match(detail, /<Fact label="Latest update">/);
  assert.match(detail, /project\.live_url \?/);
  assert.match(detail, /sourceUrl \?/);
  assert.match(detail, /project\.sourceNote \|\| \(project\.isPreview/);
  assert.match(detail, /sections\.map/);
  assert.match(detail, /<SectionHeading kicker="Continue exploring" headingId="related-projects-heading">/);
  assert.match(detail, /Related\{" "\}/);
  assert.match(detail, /animate-gradient-x text-colorfull px-1 pb-1 italic \[text-shadow:none\]">projects<\/span>/);
  assert.match(detail, /mt-14 grid gap-4 sm:grid-cols-2/);
  assert.match(detail, /Browse all projects/);
  for (const action of ["Copy URL", "View as Markdown", "Open in ChatGPT", "Open in Claude"]) {
    assert.ok(detail.includes(action), `share menu should include ${action}`);
  }
  assert.doesNotMatch(detail, /Copy as Markdown|Share by email/);
  assert.match(page, /fetchProjects\(\)\.catch\(\(\) => \[\]\)/);
});

test("related projects are selected in Admin and only published choices render in order", async () => {
  const [migration, form, api, edit, create, page, detail] = await Promise.all([
    readFile(new URL("../migrations/2026_project_related_selections.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/projects/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/projects/new/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /related_project_ids uuid\[\] NOT NULL DEFAULT/);
  assert.match(migration, /cardinality\(related_project_ids\) <= 2/);
  assert.match(form, /related_project_ids: initialData\?\.related_project_ids \?\? \[\]/);
  assert.match(form, /relatedOptions = availableProjects\.filter\(\(item\) => item\.id !== initialData\?\.id/);
  assert.match(form, /!selected && \(item\.status !== "published" \|\| selectedRelatedIds\.length >= 2\)/);
  assert.match(form, /Selected \{selectedRelatedIds\.length\} \/ 2/);
  assert.match(api, /related_project_ids: data\.related_project_ids/);
  assert.match(api, /validateRelatedProjects\(db, data\.related_project_ids, id\)/);
  assert.match(api, /referringProjectSlugs\(db, id\)/);
  assert.match(api, /\.eq\("status", "published"\)/);
  assert.match(edit, /availableProjects=\{availableProjects \?\? \[\]\}/);
  assert.match(create, /availableProjects=\{availableProjects \?\? \[\]\}/);
  assert.match(page, /project\.relatedProjectIds\.map\(\(id\) => list\.find/);
  assert.match(detail, /related\.map\(\(item, index\) => <Link/);
});

test("development stage chooses between completed and in-progress project facts", async () => {
  const [migration, stages, form, api, page, detail] = await Promise.all([
    readFile(new URL("../migrations/2026_project_development_stage.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/project-stage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ProjectForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/ProjectDetail.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /project_stage text NOT NULL DEFAULT 'completed'/);
  assert.match(migration, /expected_completion_label text/);
  for (const stage of ["planning", "initializing", "in_progress", "testing", "on_hold", "completed"]) {
    assert.ok(stages.includes(`"${stage}"`), `${stage} must be selectable`);
  }
  assert.match(form, /project_stage: initialData\?\.project_stage \?\? "completed"/);
  assert.match(form, /completed = watch\("project_stage"\) === "completed"/);
  assert.match(form, /register\("expected_completion_label"\)/);
  assert.match(api, /project_stage: z\.enum\(projectStages\)\.optional\(\)\.default\("completed"\)/);
  assert.match(api, /expected_completion_label: data\.expected_completion_label \|\| null/);
  assert.match(page, /stage: projectStages\.find\(\(stage\) => stage === p\.project_stage\) \?\? "completed"/);
  assert.match(detail, /project\.stage === "completed" \? <>/);
  assert.match(detail, /<Fact label="Expected completion" alignMobileLabel>\{project\.expectedCompletion \|\| "None"\}<\/Fact>/);
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
    if (slug === "demo-vaultaudit-scanner") {
      assert.match(html, /<dt[^>]*>Stage<\/dt><dd[^>]*>Planning<\/dd>/, slug);
      assert.match(html, /<dt[^>]*>Expected completion<\/dt><dd[^>]*>Q2 2027<\/dd>/, slug);
      assert.doesNotMatch(html, /<dt[^>]*>Built<\/dt>|<dt[^>]*>Latest update<\/dt>/, slug);
    } else {
      assert.ok(html.includes("Latest update"), slug);
      assert.doesNotMatch(html, /<dt[^>]*>Stage<\/dt>/, slug);
    }
    assert.ok(html.includes("preview stock image, not a project screenshot"), slug);
    assert.match(html, /aria-label="Image 1 of [2-9][0-9]*"/, `${slug} needs a cover followed by preview images`);
    const tagHtml = html.match(/<h2[^>]*>Tags<\/h2><ul[^>]*>(.*?)<\/ul>/s)?.[1] || "";
    const tags = [...tagHtml.matchAll(/<li[^>]*><span[^>]*>([^<]+)<\/span><\/li>/g)].map((match) => match[1]);
    const summary = html.match(/<h1[^>]*>[^<]+<\/h1><p[^>]*>([^<]+)<\/p>/)?.[1];
    if (slug === "taskflow-workspace") assert.deepEqual(tags, ["Web", "SaaS", "Productivity", "Collaboration", "Automation"]);
    assert.ok(summary, `${slug} needs a summary`);
    summaries.add(summary);
    const structuredData = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
      .map((match) => match[1]).find((value) => value.includes("CreativeWork"));
    assert.ok(structuredData, `${slug} needs structured data`);
    assert.doesNotMatch(structuredData, /example\.com|octocat/);
  }
  assert.equal(summaries.size, slugs.length);
});
