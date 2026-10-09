import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { blogListStatus, blogListUrl, PAGE_SIZE, parseBlogListParams } from "../app/admin/(dashboard)/blogs/blogList.ts";

test("list params whitelist status, sort, direction and validate page/search", () => {
  assert.deepEqual(parseBlogListParams({ status: "published", sort: "private_column", direction: "sideways", page: "-4", q: "  hello  " }), {
    q: "hello", status: "all", sort: "created_at", direction: "desc", page: 1,
  });
  assert.deepEqual(parseBlogListParams({ status: "scheduled", sort: "title", direction: "asc", page: "1001", q: "x".repeat(200) }), {
    q: "x".repeat(100), status: "scheduled", sort: "title", direction: "asc", page: 1001,
  });
  assert.equal(parseBlogListParams({ page: "99999999999999999999" }).page, 1);
  assert.equal(parseBlogListParams({ page: "2.5", status: ["live", "archived"] }).page, 1);
  assert.equal(parseBlogListParams({ page: "2.5", status: ["live", "archived"] }).status, "all");
  assert.equal(parseBlogListParams({ status: "not-live" }).status, "not-live");
  assert.equal(PAGE_SIZE, 10);
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

test("server list counts filtered posts before bounded fetch and reports failures", async () => {
  const page = await readFile(new URL("../app/admin/(dashboard)/blogs/page.tsx", import.meta.url), "utf8");
  assert.ok(page.indexOf("await requireAdmin()") < page.indexOf("createSupabaseAdminClient()"));
  assert.match(page, /createSupabaseAdminClient\(\)/);
  assert.match(page, /\.ilike\("title",/);
  assert.match(page, /\.eq\("status", "published"\)\.gt\("published_at", nowIso\)/);
  assert.match(page, /\.eq\("status", "published"\)\.lte\("published_at", nowIso\)/);
  assert.match(page, /\.eq\("status", "published"\)\.is\("published_at", null\)/);
  assert.match(page, /admin-status--live/);
  assert.match(page, /head \? \{ count: "exact", head: true \} : undefined/);
  assert.match(page, /filteredQuery\(true\),/);
  assert.match(page, /count === null/);
  assert.match(page, /redirect\(blogListUrl\(params, totalPages\)\)/);
  assert.match(page, /\.range\(start, start \+ PAGE_SIZE - 1\)/);
  assert.doesNotMatch(page, /blogs\?\.slice|more available/);
  assert.match(page, /\.order\("id", \{ ascending: true \}\)/);
  assert.match(page, /<BlogArchiveAction post=\{blog\} \/>/);
  assert.match(page, /role="alert"/);
  assert.match(page, /No posts match these filters/);
  assert.match(page, /aria-label="Blog post pages"/);
  assert.match(page, /Showing \$\{start \+ 1\}-\$\{start \+ posts\.length\} of \$\{count\} posts/);
  assert.match(page, /\{params\.page\}<\/strong> of \{totalPages\}/);
  assert.match(page, /rawParams\.saved === "1"/);
  assert.match(page, /Post saved successfully/);
});

test("filters use named accessible listboxes with custom focus and selected states", async () => {
  const filters = await readFile(new URL("../app/components/admin/BlogFilters.tsx", import.meta.url), "utf8");
  assert.match(filters, /<form action="\/admin\/blogs" method="get"/);
  assert.match(filters, /<Listbox name=\{name\} value=\{value\} onChange=\{onChange\}>/);
  assert.match(filters, /ListboxLabel/);
  assert.match(filters, /data-\[focus\]/);
  assert.match(filters, /data-\[selected\]/);
  assert.match(filters, /value: "not-live"/);
  assert.match(filters, /name="q"/);
  assert.match(filters, /type="submit"/);
  assert.match(filters, /href="\/admin\/blogs"/);
});
