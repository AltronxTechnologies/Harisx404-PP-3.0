import assert from "node:assert/strict";
import test from "node:test";
import { validateBlogMdx } from "../app/lib/blog-mdx-policy.mjs";

test("allows Blog formatting and inert CodePlayground files", () => {
  assert.doesNotThrow(() => validateBlogMdx('## Hello\n\n[Read](/blog/hello) ![pic](https://cdn.hashnode.com/a.png)\n<Callout emoji="tip">Hi{" "}<a href="https://example.com">there</a></Callout>\n<iframe src="https://codepen.io/user/embed/abc" allowFullScreen={true} />\n<CodePlayground files={{ "/index.html": `<h1>Hi</h1>`, "/a.js": "alert(1)" }} />'));
});

test("Blog-authored relative links follow the editor URL contract", () => {
  for (const url of ["/blog/post", "../post", "./post", "#heading", "?page=2", "post-slug"]) {
    assert.doesNotThrow(() => validateBlogMdx(`[Read](${url})`), url);
  }
  for (const url of ["javascript:alert(1)", "//evil.example/image", "data:text/html,evil"]) {
    assert.throws(() => validateBlogMdx(`[Read](${url})`), url);
  }
});

for (const [label, source] of Object.entries({
  esm: 'import x from "bad"\n\n# Hi',
  expression: '{globalThis.fetch("https://evil.test")}',
  nested: '{" " + globalThis.process}',
  spread: '<a {...globalThis.payload}>hey</a>',
  handler: '<a onClick="alert(1)">hey</a>',
  markdownLink: '[x](javascript:alert(1))',
  markdownImage: '![x](data:text/html,evil)',
  reference: '[x][bad]\n\n[bad]: javascript:alert(1)',
  imageReference: '![x][bad]\n\n[bad]: mailto:somebody@example.com',
  jsxLink: '<a href="javascript:alert(1)">x</a>',
  jsxImage: '<img src="data:image/svg+xml,evil" />',
  iframe: '<iframe src="https://evil.test/embed" />',
  iframeExpression: '<iframe src={"https://codepen.io/user/embed/abc"} />',
  unknownTag: '<script src="https://example.com/x" />',
  unknownAttr: '<Callout dangerouslySetInnerHTML="x" />',
  playgroundInterpolation: '<CodePlayground files={{ "/a": `hello ${globalThis.process}` }} />',
  playgroundSpread: '<CodePlayground files={{ ...globalThis.payload }} />',
  playgroundGetter: '<CodePlayground files={{ get a() { return globalThis.process } }} />',
  invalidMdx: '<Callout>',
})) {
  test(`rejects ${label}`, () => assert.throws(() => validateBlogMdx(source)));
}

test("preflight published Blog rows via read-only anonymous REST", async (t) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return t.skip("anonymous REST credentials unavailable");
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/blog_posts?select=slug,content&status=eq.published&order=slug.asc&limit=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
  });
  assert.equal(response.status, 200, `published rows REST: ${response.status}`);
  const posts = await response.json();
  const count = Number(response.headers.get("content-range")?.split("/")[1]);
  assert.ok(Number.isFinite(count) && count > 0, "published row count must be available");
  assert.equal(posts.length, count, "preflight must cover the complete published corpus");
  const rejected = [];
  for (const post of posts) {
    try { validateBlogMdx(post.content); } catch (error) { rejected.push(`${post.slug}: ${error.message}`); }
  }
  console.log(`Blog MDX preflight: ${posts.length} published, ${posts.length - rejected.length} accepted, ${rejected.length} rejected; slugs: ${rejected.join("; ") || "none"}`);
  assert.deepEqual(rejected, []);
});
