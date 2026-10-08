import assert from "node:assert/strict";
import test from "node:test";
import { stripRepeatedBlogHeading } from "../app/lib/blog-content.ts";

test("a repeated leading article title is not shown again inside the article", () => {
  assert.equal(stripRepeatedBlogHeading("# Article Title\n\nThe introduction.\n\n## Details", "Article Title"), "The introduction.\n\n## Details");
  assert.equal(stripRepeatedBlogHeading("\n# Article Title\r\n\r\nThe introduction.", "Article Title"), "The introduction.");
});

test("different first headings and headings within the article remain intact", () => {
  const content = "# A different heading\n\nThe introduction.\n\n# Article Title";
  assert.equal(stripRepeatedBlogHeading(content, "Article Title"), content);
  assert.equal(stripRepeatedBlogHeading("The introduction.\n\n# Article Title", "Article Title"), "The introduction.\n\n# Article Title");
});
