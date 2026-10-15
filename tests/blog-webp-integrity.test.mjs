import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("checked-in article WebPs are served unchanged at their direct public URLs", async () => {
  const filenames = (await readdir(new URL("../public/blog/article-images/", import.meta.url))).filter((name) => name.endsWith(".webp"));
  assert.equal(filenames.length, 20);
  for (const filename of filenames) {
    const original = await readFile(new URL(`../public/blog/article-images/${filename}`, import.meta.url));
    const image = await sharp(original).metadata();
    assert.equal(image.format, "webp");
    assert.ok(image.width >= 1200 && image.height >= 600, `${filename}: original resolution is retained`);
    const response = await fetch(`${baseUrl}/blog/article-images/${filename}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /^image\/webp/);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(original), `${filename}: direct URL preserves original bytes`);
  }
});

test("Blog cards and article diagrams request the authored WebPs without a second image encode", async () => {
  const [index, article] = await Promise.all([
    fetch(`${baseUrl}/blog`).then((response) => response.text()),
    fetch(`${baseUrl}/blog/reliable-rag`).then((response) => response.text()),
  ]);
  assert.ok(index.includes('src="/blog/article-images/reliable-rag-cover.webp"'));
  assert.ok(article.includes('src="/blog/article-images/reliable-rag-cover.webp"'));
  assert.ok(article.includes('src="/blog/article-images/reliable-rag-pipeline.webp"'));
  assert.doesNotMatch(article, /_next\/image\?url=%2Fblog%2Farticle-images%2Freliable-rag/);
  const home = await fetch(baseUrl).then((response) => response.text());
  assert.match(home, /src="\/blog\/article-images\/[^" ]+\.webp"/);
});

test("existing Cloudinary copies of the agent WebPs retain their source bytes", async (t) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return t.skip("Managed media credentials unavailable");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const [filename, uploadedName] of [
    ["securing-ai-agents-cover.webp", "securing-ai-agents-cover (2).webp"],
    ["securing-ai-agents-rule-of-two.webp", "securing-ai-agents-rule-of-two (2).webp"],
  ]) {
    const original = await readFile(new URL(`../public/blog/article-images/${filename}`, import.meta.url));
    const { data, error } = await db.from("media").select("secure_url, format, bytes").eq("original_filename", uploadedName).limit(5);
    assert.equal(error, null);
    assert.ok(data?.length, `${uploadedName}: managed upload exists`);
    for (const item of data) {
      assert.equal(item.format, "webp");
      assert.equal(item.bytes, original.byteLength);
      const response = await fetch(item.secure_url, { headers: { Accept: "image/webp" } });
      assert.equal(response.status, 200);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(original), `${filename}: Cloudinary original matches checked-in bytes`);
    }
  }
});
