import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { blogListStatus, blogListUrl, PAGE_SIZE, parseBlogListParams } from "../app/admin/(dashboard)/blogs/blogList.ts";

test("list params whitelist status, sort, direction and cap page/search", () => {
  assert.deepEqual(parseBlogListParams({ status: "published", sort: "private_column", direction: "sideways", page: "-4", q: "  hello  " }), {
    q: "hello", status: "all", sort: "created_at", direction: "desc", page: 1,
  });
  assert.deepEqual(parseBlogListParams({ status: "scheduled", sort: "title", direction: "asc", page: "999999999999999", q: "x".repeat(200) }), {
    q: "x".repeat(100), status: "scheduled", sort: "title", direction: "asc", page: 1000,
  });
  assert.equal(parseBlogListParams({ page: "2.5", status: ["live", "archived"] }).page, 1);
  assert.equal(parseBlogListParams({ page: "2.5", status: ["live", "archived"] }).status, "all");
  assert.equal(PAGE_SIZE, 20);
});

test("publication labels follow public visibility, including missing dates", () => {
  const now = Date.parse("2026-01-10T12:00:00Z");
  assert.equal(blogListStatus("draft", "2026-01-01T00:00:00Z", now), "Draft");
  assert.equal(blogListStatus("archived", "2026-01-01T00:00:00Z", now), "Archived");
  assert.equal(blogListStatus("published", "2026-01-11T00:00:00Z", now), "Scheduled");
  assert.equal(blogListStatus("published", "2026-01-10T12:00:00Z", now), "Live");
  assert.equal(blogListStatus("published", null, now), "Not live");
});

test("pagination links retain validated filters and safely encode search", () => {
  const params = parseBlogListParams({ q: "a&b", status: "live", sort: "title", direction: "asc", page: "2" });
  const url = new URL(blogListUrl(params, 3), "http://localhost");
  assert.equal(url.pathname, "/admin/blogs");
  assert.deepEqual(Object.fromEntries(url.searchParams), { q: "a&b", status: "live", sort: "title", direction: "asc", page: "3" });
  assert.equal(blogListUrl(parseBlogListParams({}), 1), "/admin/blogs");
});

test("server list filters before bounded fetch, retains archive control and reports failure", async () => {
  const page = await readFile(new URL("../app/admin/(dashboard)/blogs/page.tsx", import.meta.url), "utf8");
  assert.match(page, /createSupabaseAdminClient\(\)/);
  assert.match(page, /\.ilike\("title",/);
  assert.match(page, /\.eq\("status", "published"\)\.gt\("published_at", nowIso\)/);
  assert.match(page, /\.eq\("status", "published"\)\.lte\("published_at", nowIso\)/);
  assert.match(page, /\.range\(start, start \+ PAGE_SIZE\)/);
  assert.match(page, /blogs\?\.slice\(0, PAGE_SIZE\)/);
  assert.match(page, /\.order\("id", \{ ascending: true \}\)/);
  assert.match(page, /<BlogArchiveAction post=\{blog\} \/>/);
  assert.match(page, /role="alert"/);
  assert.match(page, /No posts match these filters/);
  assert.match(page, /aria-label="Blog post pages"/);
  assert.match(page, /rawParams\.saved === "1"/);
  assert.match(page, /Post saved successfully/);
});
