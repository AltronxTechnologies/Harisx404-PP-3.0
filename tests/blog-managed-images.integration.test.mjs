import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";
const articles = [
  ["securing-ai-agents", "securing-ai-agents-cover", "securing-ai-agents-rule-of-two"],
  ["post-quantum-cryptography-migration", "post-quantum-cryptography-migration-cover", "post-quantum-cryptography-hybrid-exchange"],
  ["ai-security-operations-center", "ai-security-operations-center-cover", "ai-security-operations-center-autonomy-ladder"],
  ["reliable-rag", "reliable-rag-cover", "reliable-rag-pipeline"],
  ["small-vs-large-language-models", "small-vs-large-language-models-cover", "small-vs-large-language-models-route-escalate"],
  ["ai-application-evaluation", "ai-application-evaluation-cover", "ai-application-evaluation-pipeline"],
  ["ai-workloads-network-architecture", "ai-workloads-network-architecture-cover", "ai-workloads-network-clos-roce"],
  ["zero-trust-networking-cloud", "zero-trust-networking-cloud-cover", "zero-trust-networking-pdp-pep"],
  ["nextjs-16-cache-components", "nextjs-16-cache-components-cover", "nextjs-16-cache-mental-model"],
  ["type-safe-mern-typescript", "type-safe-mern-typescript-cover", "type-safe-mern-single-source-of-truth"],
];

test("published articles, cards and metadata use managed covers and one inline diagram", async (t) => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return t.skip("Connected credentials unavailable");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const index = await fetch(`${baseUrl}/blog`).then((response) => response.text());
  for (const [slug, cover, diagram] of articles) {
    const { data: post, error } = await db.from("blog_posts").select("id, content, cover_image_id, cover_image_url").eq("slug", slug).single();
    assert.equal(error, null);
    const { data: attachments, error: attachedError } = await db.from("blog_post_media")
      .select("media_id, media:media_id(id, secure_url, original_filename)")
      .eq("blog_post_id", post.id).order("display_order");
    assert.equal(attachedError, null);
    assert.equal(attachments.length, 2, `${slug}: cover and diagram attached`);
    assert.equal(attachments[0].media_id, post.cover_image_id);
    const coverUrl = attachments[0].media.secure_url;
    const diagramUrl = attachments[1].media.secure_url;
    assert.equal(post.cover_image_url, coverUrl);
    assert.match(attachments[0].media.original_filename, new RegExp(`^${cover}(?: \\(2\\))?\\.webp$`));
    assert.match(attachments[1].media.original_filename, new RegExp(`^${diagram}(?: \\(2\\))?\\.webp$`));
    assert.ok(post.content.includes(diagramUrl));
    const response = await fetch(`${baseUrl}/blog/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.ok(html.includes(`<meta property="og:image" content="${coverUrl}"`), `${slug}: Open Graph cover`);
    assert.ok(html.includes(`<meta name="twitter:image" content="${coverUrl}"`), `${slug}: X cover`);
    assert.ok(html.includes(`"image":"${coverUrl}"`), `${slug}: BlogPosting cover`);
    assert.ok(html.includes(`src="${coverUrl}"`), `${slug}: untransformed cover`);
    assert.ok(html.includes(`src="${diagramUrl}"`), `${slug}: untransformed diagram`);
    if (slug === "securing-ai-agents") assert.doesNotMatch(post.content, /!\[h\]\(|!\[j\]\(/, "legacy duplicate inline images are no longer stored");
    assert.doesNotMatch(html, /This article content is unavailable because its formatting could not be safely rendered/, slug);
    assert.ok(index.includes(`src="${coverUrl}"`), `${slug}: Blog index cover`);
    for (const url of [coverUrl, diagramUrl]) {
      const asset = await fetch(url);
      assert.equal(asset.status, 200, `${slug}: managed asset`);
      assert.match(asset.headers.get("content-type") || "", /^image\/webp/);
    }
  }
});
