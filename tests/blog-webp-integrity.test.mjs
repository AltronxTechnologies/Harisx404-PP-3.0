import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

test("twenty managed article WebPs retain their full-resolution originals", async (t) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return t.skip("Managed media credentials unavailable");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: posts, error } = await db.from("blog_posts").select("id, slug").eq("status", "published");
  assert.equal(error, null);
  const ids = posts.filter((post) => ["securing-ai-agents", "reliable-rag", "post-quantum-cryptography-migration", "ai-security-operations-center", "small-vs-large-language-models", "ai-application-evaluation", "ai-workloads-network-architecture", "zero-trust-networking-cloud", "nextjs-16-cache-components", "type-safe-mern-typescript"].includes(post.slug)).map((post) => post.id);
  assert.equal(ids.length, 10);
  const { data: links, error: linkError } = await db.from("blog_post_media")
    .select("blog_post_id, media:media_id(secure_url, bytes, width, height, format)").in("blog_post_id", ids);
  assert.equal(linkError, null);
  assert.equal(links.length, 20);
  for (const link of links) {
    const item = link.media;
    assert.equal(item.format, "webp");
    const response = await fetch(item.secure_url, { headers: { Accept: "image/webp" } });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, item.bytes);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, item.width);
    assert.equal(metadata.height, item.height);
    assert.ok(metadata.width >= 1200 && metadata.height >= 600);
  }
});
