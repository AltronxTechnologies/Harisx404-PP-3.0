import assert from "node:assert/strict";
import test from "node:test";
import { isOriginalBlogWebp, optimizeImageUrl } from "../app/lib/image-utils";

test("managed article WebPs keep their original Cloudinary delivery URL", () => {
  const original = "https://res.cloudinary.com/i22q5puf/image/upload/v1792087127/portfolio/blog/c1000000-0000-0000-0000-000000000004/reliable-rag-cover.webp";
  assert.equal(isOriginalBlogWebp(original), true);
  assert.equal(optimizeImageUrl(original, 1600), original);
  assert.equal(isOriginalBlogWebp("/blog/article-images/reliable-rag-cover.webp"), false);
  assert.equal(isOriginalBlogWebp("https://other.example/image/upload/v1/portfolio/blog/c1000000-0000-0000-0000-000000000004/reliable-rag-cover.webp"), false);
  assert.match(optimizeImageUrl("https://res.cloudinary.com/i22q5puf/image/upload/v1/portfolio/projects/example.jpg", 800), /f_auto,q_auto,w_800/);
});
