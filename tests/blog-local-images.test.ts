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
    assert.equal(articleCover(slug, "https://example.com/old-cover.jpg"), `/blog/article-images/${entry.cover}`);
  }
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
