import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("published code blocks expose named copy buttons", async () => {
  const response = await fetch(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<button[^>]*aria-label="Copy code"/);
  assert.match(html, /<h2 id="required-favicon-formats"[^>]*><a href="#required-favicon-formats"[^>]*>/);
});
