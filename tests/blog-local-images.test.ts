import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { articleCover, articleIllustration, articleImages } from "../app/blog/article-images";

test("each published editorial article has two real local WebP assets", async () => {
  assert.equal(Object.keys(articleImages).length, 10);
  for (const [slug, entry] of Object.entries(articleImages)) {
    for (const name of [entry.cover, entry.illustration]) {
      assert.match(name, /\.webp$/);
      const file = new URL(`../public/blog/article-images/${name}`, import.meta.url);
      assert.ok((await stat(file)).size > 1000, `${slug}: ${name} exists`);
    }
    assert.equal(articleCover(slug, "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"), `/blog/article-images/${entry.cover}`);
    assert.equal(articleCover(slug, "/blog/production-placeholder.jpg"), `/blog/article-images/${entry.cover}`);
    assert.equal(articleCover(slug, "https://example.com/new-cover.webp"), "https://example.com/new-cover.webp", `${slug}: a future Admin cover is honored`);
  }
  assert.equal(articleCover("securing-ai-agents", "https://res.cloudinary.com/i22q5puf/image/upload/v1792000121/portfolio/blog/c1000000-0000-0000-0000-000000000001/n5llzec1gneqawlpspxh.webp"), "/blog/article-images/securing-ai-agents-cover.webp");
  assert.equal(articleCover("unrelated-article", "/blog/custom.webp"), "/blog/custom.webp");
});

test("each diagram is inserted once after its matching section, without replacing editorial text", async () => {
  for (const [slug, entry] of Object.entries(articleImages)) {
    const file = new URL(`../content/blog/${slug}.mdx`, import.meta.url);
    const code = await readFile(file, "utf8");
    const output = articleIllustration(slug, code);
    const heading = `## ${entry.section}`;
    const image = `/blog/article-images/${entry.illustration}`;
    assert.ok(output.includes(heading), `${slug}: matching section exists`);
    assert.equal(output.split(image).length - 1, 1, `${slug}: exactly one illustration`);
    assert.ok(output.indexOf(image) > output.indexOf(heading), `${slug}: image follows its section`);
    assert.ok(output.indexOf(image) < output.indexOf("\n## ", output.indexOf(heading) + heading.length), `${slug}: image precedes next section`);
    assert.equal(articleIllustration(slug, output), output, `${slug}: injection is idempotent`);
    assert.equal(articleIllustration(slug, code.replace(heading, "## Editor renamed this section")), code.replace(heading, "## Editor renamed this section"));
    assert.equal(articleIllustration(slug, `${code}\n![Editor's image](/blog/other.webp)`), `${code}\n![Editor's image](/blog/other.webp)`);
  }
});

test("only the two old agent illustrations are replaced, leaving surrounding published text intact", async () => {
  const source = await readFile(new URL("../content/blog/securing-ai-agents.mdx", import.meta.url), "utf8");
  const oldA = "![h](https://res.cloudinary.com/i22q5puf/image/upload/v1792000121/portfolio/blog/c1000000-0000-0000-0000-000000000001/n5llzec1gneqawlpspxh.webp)";
  const oldB = "![j](https://res.cloudinary.com/i22q5puf/image/upload/v1792000125/portfolio/blog/c1000000-0000-0000-0000-000000000001/uesnrbe5wu7opbui9bfb.webp)";
  const published = source.replace("An AI agent is a language model", `${oldA}\n\nAn AI agent is a language model`)
    .replace("## Two ways untrusted text gets in", `${oldB}\n\n## Two ways untrusted text gets in`);
  const updated = articleIllustration("securing-ai-agents", published);
  assert.doesNotMatch(updated, /n5llzec1gneqawlpspxh|uesnrbe5wu7opbui9bfb/);
  assert.match(updated, /An AI agent is a language model/);
  assert.match(updated, /## Two ways untrusted text gets in/);
  assert.equal(updated.split("/blog/article-images/securing-ai-agents-rule-of-two.webp").length - 1, 1);
  assert.equal(articleIllustration("securing-ai-agents", updated), updated);
});
