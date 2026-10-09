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
  assert.match(source, /bodyHiddenOnXl \? \(/);
  assert.match(source, /frame-light-edge group relative block/);
});

test("Home-only covers softly zoom the image and both Home layouts share the measured three-row tech stack", () => {
  const source = readFileSync(new URL("../app/components/home/CaseStudies.tsx", import.meta.url), "utf8");
  const homeCover = source.split("{bodyHiddenOnXl ? (")[1]?.split("\n        ) : (\n        <div\n          ref={panelRef}")[0];
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
