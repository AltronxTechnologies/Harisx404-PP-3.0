import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

for (const [route, sourcePath, title] of [
  ["/legal/privacy", "../app/legal/privacy/page.tsx", "Your Data,"],
  ["/legal/terms", "../app/legal/terms/page.tsx", "Simple Terms,"],
]) {
  test(`${route} uses the public-page frame and valid hero semantics`, async () => {
    const [response, source] = await Promise.all([
      fetch(`${baseUrl}${route}`),
      readFile(new URL(sourcePath, import.meta.url), "utf8"),
    ]);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    const heading = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0] || "";
    assert.ok(heading);
    assert.doesNotMatch(heading, /<p\b/);
    assert.match(html, /From concept to creation/);
    assert.match(source, /<GridWrapper>/);
    assert.match(source, /<PaperHeroTexture/);
    assert.match(source, /className="mt-28"/);
    assert.doesNotMatch(source, /<HeroTexture|Hatched side rails/);
  });
}

test("Terms keeps the owner-approved design attribution", async () => {
  const response = await fetch(`${baseUrl}/legal/terms`);
  const html = await response.text();
  assert.match(html, /id="design-inspiration"/);
  assert.match(html, /href="https:\/\/aayushbharti\.in"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Aayush Bharti/);
});
