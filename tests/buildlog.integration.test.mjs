import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.BUILDLOG_BASE_URL || "http://localhost:3000";

test("Buildlog renders the responsive release collection", async () => {
  const response = await fetch(`${baseUrl}/buildlog`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /The build never stops/);
  assert.match(html, /Build\. Ship\./);
  assert.match(html, /Release archive/);
  assert.match(html, /Shipped work and clearly labelled plans/);
  assert.match(html, /Show 5 shipped updates/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, />GitHub</);
  assert.match(html, /Live project/);
  const filterIds = [...html.matchAll(/<filter id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(filterIds).size, filterIds.length);
});

test("Buildlog source has valid hero semantics and explicit route states", async () => {
  const [page, collection, mark, loading, error] = await Promise.all([
    readFile(new URL("../app/buildlog/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/buildlog/BuildlogCollection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/buildlog/SketchCheckbox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/buildlog/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/buildlog/error.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /<h1[^>]*>\s*<p/);
  assert.match(page, /PaperHeroTexture/);
  assert.match(page, /border-border-primary/);
  assert.match(page, /projects\.length > 0/);
  assert.ok(
    collection.indexOf("aria-controls={shippedRegionId}") <
      collection.indexOf("<div id={shippedRegionId}>")
  );
  assert.match(collection, /data-project-links/);
  assert.match(collection, /col-span-2/);
  assert.doesNotMatch(mark, /feTurbulence|feDisplacementMap/);
  assert.match(mark, /fill-text-primary/);
  assert.match(loading, /Loading Buildlog/);
  assert.match(error, /role="alert"/);
  assert.match(error, /headingRef\.current\?\.focus/);
});

test("Buildlog admin API is fail-closed for every method", async () => {
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/buildlog`, { method });
    assert.equal(response.status, 401, `${method} should require administrator authorization`);
  }
});

test("Buildlog schema, seed, links, API, admin form, and cache contract agree", async () => {
  const [migration, seed, linksMigration, api, form, publicData, collection] = await Promise.all([
    readFile(new URL("../migrations/2026_buildlog_projects.sql", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_buildlog_seed.sql", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_buildlog_zz_project_links.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/buildlog/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/BuildlogForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/buildlog/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/buildlog/BuildlogCollection.tsx", import.meta.url), "utf8"),
  ]);
  const fields = [
    "name",
    "tagline",
    "info",
    "current_version",
    "items",
    "display_order",
    "status",
    "is_demo",
  ];

  fields.forEach((field) => {
    assert.match(migration, new RegExp(field));
    assert.match(api, new RegExp(field));
    assert.match(form, new RegExp(field));
  });
  for (const field of ["github_url", "live_url"]) {
    assert.match(linksMigration, new RegExp(field));
    assert.match(api, new RegExp(field));
    assert.match(form, new RegExp(field));
  }
  assert.match(api, /auth\.getUser\(\)/);
  assert.match(api, /revalidatePath\("\/buildlog"\)/);
  assert.match(api, /revalidateTag\("buildlog"\)/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.buildlog_projects FROM anon, authenticated/);
  assert.match(migration, /public_buildlog_projects/);
  assert.match(publicData, /public_buildlog_projects/);
  assert.match(seed, /ON CONFLICT DO NOTHING/);
  assert.match(seed, /"title":/);
  assert.match(seed, /"display_order":/);
  assert.match(linksMigration, /buildlog_https_urls/);
  assert.match(linksMigration, /public_buildlog_projects/);
  assert.match(collection, /aria-expanded/);
  assert.match(collection, /window\.history\.pushState/);
  assert.match(collection, /In progress/);
  assert.match(collection, /Completed/);
});

test("Legacy changelog admin routes redirect to Buildlog", async () => {
  const response = await fetch(`${baseUrl}/admin/changelogs`, { redirect: "manual" });
  assert.ok([307, 308].includes(response.status));
  assert.equal(response.headers.get("location"), "/admin/login");

  const redirectConfig = await readFile(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(redirectConfig, /source: "\/changelog"/);
  assert.match(redirectConfig, /destination: "\/buildlog"/);
});
