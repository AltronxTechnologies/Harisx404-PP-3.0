import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

for (const [route, sourcePath, title] of [
  ["/legal/privacy", "../app/legal/privacy/page.tsx", "Privacy Policy."],
  ["/legal/terms", "../app/legal/terms/page.tsx", "Terms of Use."],
]) {
  test(`${route} uses the public-page frame and valid hero semantics`, async () => {
    const [response, source] = await Promise.all([
      fetch(`${baseUrl}${route}`),
      readFile(new URL(sourcePath, import.meta.url), "utf8"),
    ]);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    const heading = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0] || "";
    assert.ok(heading);
    assert.doesNotMatch(heading, /<p\b/);
    assert.equal(heading.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(), title);
    assert.match(html, />Legal<\/p>/);
    assert.match(html, /From concept to creation/);
    assert.match(source, /<GridWrapper>/);
    assert.match(source, /<PaperHeroTexture/);
    assert.match(source, /className="mt-28"/);
    assert.doesNotMatch(source, /<HeroTexture|Hatched side rails/);
  });
}

test("Terms omits the design-inspiration card while retaining the required credit", async () => {
  const response = await fetch(`${baseUrl}/legal/terms`);
  const html = await response.text();
  assert.doesNotMatch(html, /id="design-inspiration"|>Design inspiration</);
  assert.match(html, /href="https:\/\/aayushbharti\.in"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Aayush Bharti/);
});

test("Privacy describes the implemented visitor data flows without absolute tracking claims", async () => {
  const response = await fetch(`${baseUrl}/legal/privacy`);
  const html = await response.text();
  for (const value of [
    "offered provider",
    "subject, inquiry type",
    "Testimonials",
    "email updates on a blog article",
    "identifier cookie",
    "external AI provider",
    "email-derived hash",
    "Abuse prevention",
    "Access &amp; Deletion Requests",
  ]) {
    assert.ok(html.includes(value), `${value} should appear in Privacy`);
  }
  assert.doesNotMatch(html, /No cookies, no IP logs|no selling or sharing of personal data|permanent deletion of anything/);
  assert.doesNotMatch(html, /Newsletter Email|Google Gemini|>Loops</);
});

test("Terms distinguishes credited material and visitor submissions", async () => {
  const response = await fetch(`${baseUrl}/legal/terms`);
  const html = await response.text();
  assert.match(html, /credited third-party work/);
  assert.match(html, /testimonials are reviewed before publication/);
  assert.match(html, /To the extent permitted by applicable law/);
  assert.match(html, /dateTime="2026-09-25"/);
  assert.doesNotMatch(html, /All writing, photographs, projects, and personal content remain original/);
});
