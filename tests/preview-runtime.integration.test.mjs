import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("core preview routes render without persistent loading markup", async () => {
  for (const route of ["/", "/buildlog", "/projects", "/blog"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} should render`);
    const html = await response.text();
    assert.doesNotMatch(html, /\/blog\/https:\/\//, `${route} should not emit malformed remote images`);
  }
});

test("preview data paths are bounded and route-specific", async () => {
  const [buildlogData, serverStats, lighthouseStats, installer] =
    await Promise.all([
      readFile(new URL("../app/buildlog/data.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/lib/stats/server-stats.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/lib/stats/lighthouse-stats.ts", import.meta.url), "utf8"),
      readFile(new URL("../.alloy/install-deps.sh", import.meta.url), "utf8"),
    ]);

  assert.match(buildlogData, /public_buildlog_projects/);
  assert.match(buildlogData, /process\.env\.NODE_ENV === "production"/);
  assert.match(serverStats, /Promise\.all/);
  assert.match(lighthouseStats, /requestTimeoutMs/);
  assert.match(lighthouseStats, /15000/);
  assert.match(lighthouseStats, /revalidate: 3600/);
  assert.match(lighthouseStats, /process\.env\.IS_ALLOY === "true"/);
  assert.match(installer, /\.alloy-package-lock\.sha256/);
});

test("retired Test, Attribution, and Stats routes are fully removed", async () => {
  for (const route of ["/test", "/attribution", "/stats"]) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    assert.equal(response.status, 404, `${route} should be removed`);
  }

  const [footer, sitemap, terms] = await Promise.all([
    readFile(new URL("../app/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/legal/terms/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(footer, /\/test|\/attribution|\/stats|Test Page/);
  const specifics = footer.slice(footer.indexOf('title: "Specifics"'), footer.indexOf('title: "Extra"'));
  const extra = footer.slice(footer.indexOf('title: "Extra"'), footer.indexOf("const metaLinks"));
  assert.doesNotMatch(specifics, /href: "\/links"/);
  assert.ok(extra.indexOf('href: "/links"') < extra.indexOf('href: "/buildlog"'));
  assert.doesNotMatch(sitemap, /\/test|\/attribution|\/stats/);
  assert.match(terms, /https:\/\/aayushbharti\.in/);
  assert.doesNotMatch(terms, /nofollow/);
});
