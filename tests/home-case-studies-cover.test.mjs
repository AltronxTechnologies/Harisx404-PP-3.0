import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Home uses labelled 3:2 project cover links without an in-cover tagline", async (t) => {
  const response = await fetch(`${process.env.PREVIEW_BASE_URL || "http://localhost:3000"}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  if (!html.includes("Case Studies")) return t.skip("No published projects on Home");
  const covers = [...html.matchAll(/<a\b(?=[^>]*href="\/projects\/[^\"]+")(?=[^>]*aria-label="View [^\"]+ case study")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(covers.length > 0, "Home Case Studies has labelled cover links");
  for (const [, cover] of covers) {
    assert.match(cover, /aspect-\[3\/2\]/);
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
