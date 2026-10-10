import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Home uses 3:2 framed cover links with the original border and line arrow", async (t) => {
  const response = await fetch(`${process.env.PREVIEW_BASE_URL || "http://localhost:3000"}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  if (!html.includes("Case Studies")) return t.skip("No published projects on Home");
  const covers = [...html.matchAll(/<a\b(?=[^>]*href="\/projects\/[^\"]+")(?=[^>]*aria-label="View [^\"]+ case study")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(covers.length > 0, "Home Case Studies has labelled cover links");
  for (const [link, cover] of covers) {
    assert.match(link, /aspect-\[3\/2\]/);
    assert.match(link, /hover:-translate-y-1/);
    assert.match(cover, /border-8 border-white/);
    assert.match(cover, /dark:border-zinc-800/);
    assert.match(cover, /<svg[^>]*h-4 w-6/);
    assert.doesNotMatch(cover, /bg-black\/60/, "the arrow has no circular badge");
    assert.doesNotMatch(cover, /<h3\b/, "the two-line tagline is not over the cover");
    assert.match(cover, /<img[^>]*alt=""/, "the project cover is present and the link is named");
  }
});

test("Projects index still uses the established shared card recipe", () => {
  const index = readFileSync(new URL("../app/projects/ProjectsIndex.tsx", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/components/home/CaseStudies.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(index, /bodyHiddenOnXl/);
  assert.match(index, /coverHeading="title"/);
  assert.match(source, /coverHeading === "title" \? \(/);
  assert.match(source, /frame-light-edge group relative block/);
  assert.match(source, /<h3 className="mb-2 font-display text-2xl/);
});

test("Projects index uses the same 3:2 image-only covers with titles below", async (t) => {
  const response = await fetch(`${process.env.PREVIEW_BASE_URL || "http://localhost:3000"}/projects`);
  assert.equal(response.status, 200);
  const html = await response.text();
  if (!html.includes("projects found")) return t.skip("No published projects");
  const covers = [...html.matchAll(/<a\b(?=[^>]*href="\/projects\/[^\"]+")(?=[^>]*aria-label="View [^\"]+ case study")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(covers.length > 0, "Projects index has labeled image covers");
  for (const [link, cover] of covers) {
    assert.match(link, /aspect-\[3\/2\]/);
    assert.match(link, /hover:-translate-y-1/);
    assert.match(cover, /border-8 border-white/);
    assert.doesNotMatch(cover, /<h3\b/, "project title is not over the image");
    assert.match(cover, /<img[^>]*alt=""/, "the cover image is decorative inside a named link");
  }
  assert.match(html, /<h3 class="mb-2 font-display text-2xl[^\"]*"><a[^>]*href="\/projects\//);
});

test("Home-only covers softly zoom the image and both Home layouts share the measured three-row tech stack", () => {
  const source = readFileSync(new URL("../app/components/home/CaseStudies.tsx", import.meta.url), "utf8");
  const homeCover = source.split("{coverHeading === \"title\" ? (")[1]?.split("\n        ) : (\n        <div\n          ref={panelRef}")[0];
  assert.ok(homeCover, "the Home cover has its own rendering branch");
  assert.match(homeCover, /group-hover:scale-\[1\.03\]/);
  assert.doesNotMatch(homeCover, /group-hover:border-|shadow-\[inset_/);
  assert.match(homeCover, /motion-reduce:transition-none/);
  assert.match(source, /probe\.textContent = `\+\$\{chips\.length - count\}`/);
  assert.match(source, /<HomeTechStack tech=\{project\.tech\} className="mt-4"/);
  assert.match(source, /<HomeTechStack tech=\{project\.tech\} className="mt-\[22px\]"/);
  assert.match(source, /tech\.slice\(0, visibleTechCount\)/);
  assert.match(source, /\+\{tech\.length - visibleTechCount\}/);
});

test("Home kickers remain 12px, while chip speed and Blog image hover stay consistent", () => {
  const dir = new URL("../app/components/home/", import.meta.url);
  for (const name of ["HomeBento", "CaseStudies", "Writings", "AboutTeaser", "Testimonials", "MySiteGrid", "HomeFaq"]) {
    assert.doesNotMatch(readFileSync(new URL(`${name}.tsx`, dir), "utf8"), /xl:\[&>p\]:text-\[13px\]/, `${name} keeps the shared 12px kicker`);
  }
  assert.doesNotMatch(readFileSync(new URL("CtaSection.tsx", dir), "utf8"), /xl:text-\[13px\]/);
  const bento = readFileSync(new URL("HomeBento.tsx", dir), "utf8");
  assert.match(bento, /group\.getBoundingClientRect\(\)\.width \/ 60/);
  assert.match(bento, /animate-marquee-pair/);
  assert.doesNotMatch(bento, /duration=\{(?:40|43|46)\}/);
  const writings = readFileSync(new URL("Writings.tsx", dir), "utf8");
  assert.equal((writings.match(/group-hover:scale-\[1\.03\]/g) || []).length, 4);
  const studies = readFileSync(new URL("CaseStudies.tsx", dir), "utf8");
  assert.match(studies, /imagePriority=\{i === 0\}/);
  assert.match(studies, /imageSizes="\(min-width: 1280px\)/);
});
