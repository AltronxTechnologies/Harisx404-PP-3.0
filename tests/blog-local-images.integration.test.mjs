import assert from "node:assert/strict";
import test from "node:test";

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

test("published articles, cards and social metadata use the same local cover and one inline diagram", async () => {
  const index = await fetch(`${baseUrl}/blog`).then((response) => response.text());
  for (const [slug, cover, diagram] of articles) {
    const response = await fetch(`${baseUrl}/blog/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    const url = `https://harisx404.vercel.app/blog/article-images/${cover}.webp`;
    assert.ok(html.includes(`<meta property="og:image" content="${url}"`), `${slug}: Open Graph cover`);
    assert.ok(html.includes(`<meta name="twitter:image" content="${url}"`), `${slug}: X cover`);
    assert.ok(html.includes(`"image":"${url}"`), `${slug}: BlogPosting cover`);
    assert.ok(html.includes(`${diagram}.webp`), `${slug}: article diagram`);
    assert.doesNotMatch(html, /This article content is unavailable because its formatting could not be safely rendered/, slug);
    assert.ok(index.includes(`${cover}.webp`), `${slug}: Blog index cover`);
    for (const name of [cover, diagram]) {
      const asset = await fetch(`${baseUrl}/blog/article-images/${name}.webp`);
      assert.equal(asset.status, 200, `${slug}: local asset`);
      assert.match(asset.headers.get("content-type") || "", /^image\/webp/);
    }
  }
});
