import assert from "node:assert/strict";
import test from "node:test";
import { isOwnBlogCanonical } from "../app/lib/blog-canonical.ts";

const origin = "https://example.com";

test("RSS and sitemap keep only self-canonical Blog articles", () => {
  assert.equal(isOwnBlogCanonical("post", null, origin), true);
  assert.equal(isOwnBlogCanonical("post", "https://example.com/blog/post", origin), true);
  assert.equal(isOwnBlogCanonical("post", "https://author.example/articles/post", origin), false);
  assert.equal(isOwnBlogCanonical("post", "https://example.com/blog/another", origin), false);
  assert.equal(isOwnBlogCanonical("post", "javascript:alert(1)", origin), true);
  assert.equal(isOwnBlogCanonical("post", "https://user:pass@example.com/blog/post", origin), true);
  assert.equal(isOwnBlogCanonical("post", "bad legacy URL", origin), true);
});
