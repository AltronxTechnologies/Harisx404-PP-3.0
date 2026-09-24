import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

test("Home and About render live GitHub and credential surfaces", async () => {
  for (const route of ["/", "/about"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /GitHub activity/);
    assert.match(html, /Credentials/);
    assert.doesNotMatch(html, /Shipped, counted, public|Explore stats|href="\/stats"/);
  }
});

test("public Stats discovery is retired without duplicate Buildlog links", async () => {
  const [navbar, footer, sitemap, home, about, certificationApi, search, llms] = await Promise.all([
    readFile(new URL("../app/components/Navbar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/certifications/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/navbar/SearchModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/llms.txt", import.meta.url), "utf8"),
  ]);
  for (const source of [navbar, footer, sitemap, home, about]) assert.doesNotMatch(source, /["'`]\/stats["'`]/);
  assert.equal((navbar.match(/href="\/buildlog"/g) || []).length, 1);
  assert.equal((footer.match(/href: "\/buildlog"/g) || []).length, 1);
  assert.match(certificationApi, /revalidatePath\("\/"\)/);
  assert.doesNotMatch(search, /Type 'stats'/);
  assert.match(search, /name: "Buildlog", link: "\/buildlog"/);
  assert.doesNotMatch(llms, /\/stats/);

  const stats = await fetch(`${baseUrl}/stats`, { redirect: "manual" });
  assert.equal(stats.status, 404);
  const analytics = await fetch(`${baseUrl}/admin/analytics`, { redirect: "manual" });
  assert.ok([307, 308].includes(analytics.status));
  assert.equal(analytics.headers.get("location"), "/admin/login");
});

test("GitHub activity and credential cards use real bounded data contracts", async () => {
  const [live, githubServer, homeBento, mySiteGrid, home, about, credentialData, credentialSummary, preview, adminAnalytics, adminSidebar, adminLayout, adminDashboard, serverStats, lighthouse, buildStats, credentialSeed] = await Promise.all([
    readFile(new URL("../app/lib/live-stats.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/github/GitHubActivityBentoServer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/home/HomeBento.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/home/MySiteGrid.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/credentials/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/credentials/summary.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/credentials/CredentialBentoPreview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/analytics/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/Sidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stats/server-stats.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stats/lighthouse-stats.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stats/build-time-stats.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_credentials_review_seed.sql", import.meta.url), "utf8"),
  ]);
  assert.match(live, /github\.com\/users\/\$\{HANDLE\}\/contributions/);
  assert.match(live, /revalidate: 3600/);
  assert.match(live, /REQUEST_TIMEOUT_MS = 2500/);
  assert.match(live, /AbortSignal\.timeout/);
  assert.match(live, /if \(!totalMatch\) return cachedOrUnavailable\(\)/);
  assert.match(live, /githubLastSuccessfulActivity/);
  assert.match(live, /freshness: "cached"/);
  assert.match(live, /tooltipPattern/);
  assert.match(live, /count: number/);
  assert.match(live, /unstable_cache/);
  assert.match(live, /github-public-activity-v2/);
  assert.match(githubServer, /await fetchGitHubActivity\(\)/);
  for (const source of [home, about]) {
    assert.match(source, /<Suspense fallback={<GitHubActivityBentoSkeleton/);
    assert.doesNotMatch(source, /fetchGitHubActivity\(\)/);
  }
  assert.match(homeBento, /data-github-contribution-calendar/);
  assert.match(homeBento, /contributionColors/);
  assert.match(homeBento, /Use arrow keys to inspect days/);
  assert.match(homeBento, /ResizeObserver/);
  assert.match(homeBento, /weekCount/);
  assert.match(mySiteGrid, /data-home-credential-archive/);
  assert.match(mySiteGrid, /A growing archive of learning, backed by proof/);
  assert.doesNotMatch(mySiteGrid, /credentialSummary\.items|published milestones/);
  assert.match(credentialData, /public_certifications/);
  assert.match(credentialSummary, /slice\(0, 3\)/);
  assert.match(preview, /credential\.issuer\.trim\(\)\.charAt\(0\)/);
  assert.doesNotMatch(preview, /<img|CredentialImage/);
  assert.match(adminAnalytics, /Top viewed articles/);
  assert.match(adminAnalytics, /Reaction breakdown/);
  assert.match(adminAnalytics, /Lighthouse health/);
  assert.match(adminAnalytics, /Math\.round\(value\)/);
  assert.doesNotMatch(adminAnalytics, /value \* 100/);
  assert.match(adminAnalytics, /Some analytics sources are temporarily unavailable/);
  assert.match(adminAnalytics, /Article view analytics are temporarily unavailable/);
  assert.match(adminSidebar, /Open admin navigation/);
  assert.match(adminSidebar, /mobile-admin-navigation/);
  assert.match(adminLayout, /pt-14 sm:gap-4/);
  assert.match(adminDashboard, /serverStats \? serverStats\.totalViews : "—"/);
  assert.match(serverStats, /Unable to load one or more analytics data sources/);
  assert.match(lighthouse, /throw new Error\(`PageSpeed/);
  assert.match(lighthouse, /Promise\.allSettled/);
  assert.match(lighthouse, /partialFailure/);
  assert.doesNotMatch(buildStats, /changelog|totalWords|combinedReading/);
  assert.doesNotMatch(credentialSeed, /cdn\.simpleicons\.org\/cisco/);
});
