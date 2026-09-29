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
    assert.match(source, /<h2 className="mt-1 font-display text-2xl font-medium leading-snug/);
    assert.match(source, /<p className="font-display text-2xl font-medium leading-snug text-text-secondary/);
    assert.match(source, /relative hidden border-x border-dashed border-border-primary lg:col-span-1 lg:block/);
    assert.match(source, /-top-10 h-10 border-x border-dashed border-border-primary/);
    assert.match(source, /-bottom-10 -left-px -right-px h-10 border-x/);
    assert.match(source, /-mx-2 h-px bg-border-primary sm:-mx-3 lg:mx-0/);
    assert.equal((source.match(/my-8 h-px bg-border-primary/g) || []).length, route === "/legal/privacy" ? 1 : 2);
    assert.doesNotMatch(source, /bg-neutral-400\/40 dark:bg-white\/20/);
    assert.doesNotMatch(source, /border-t border-dashed border-neutral-200 dark:border-neutral-800/);
    assert.match(source, /<div><SectionDivider \/><\/div>/);
    assert.match(source, /<div className="lg:mt-10"><SectionDivider \/><\/div>/);
    assert.match(source, /space-y-10 lg:mt-10/);
    assert.equal((source.match(/mx-auto grid w-full max-w-6xl grid-cols-1 px-2 sm:px-4 lg:grid-cols-12 lg:px-8/g) || []).length, 3);
    assert.match(source, /href="mailto:itsharis\.tech@gmail\.com" className="[^"]*\[overflow-wrap:anywhere\]/);
    assert.match(source, /className="mt-28"/);
    assert.doesNotMatch(source, /<HeroTexture|Hatched side rails/);
  });
}

test("Terms does not show the retired design-inspiration credit", async () => {
  const response = await fetch(`${baseUrl}/legal/terms`);
  const html = await response.text();
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
  assert.ok(main);
  assert.doesNotMatch(html, /id="design-inspiration"|>Design inspiration</);
  assert.doesNotMatch(main, /<a[^>]*href="https?:\/\//);
  assert.match(html, /Third-party materials and visitor contributions remain with their/);
});

test("Privacy describes the implemented visitor data flows without absolute tracking claims", async () => {
  const response = await fetch(`${baseUrl}/legal/privacy`);
  const html = await response.text();
  for (const value of [
    "offered provider",
    "subject, inquiry type",
    "Testimonials",
    "Contact messages may be forwarded through an email service",
    "Testimonial submissions may trigger an email notification",
    "identifier cookie",
    "external AI provider",
    "email-derived hash",
    "Abuse prevention",
    "Error diagnostics",
    "technical trace, and error identifier",
    "Error details can contain information involved in the failure",
    "Access &amp; Deletion Requests",
  ]) {
    assert.ok(html.includes(value), `${value} should appear in Privacy`);
  }
  assert.doesNotMatch(html, /No cookies, no IP logs|no selling or sharing of personal data|permanent deletion of anything/);
  assert.doesNotMatch(html, /Newsletter Email|email updates on a blog article|Google Gemini|>Loops</);
});

test("Terms distinguishes portfolio material and visitor submissions", async () => {
  const response = await fetch(`${baseUrl}/legal/terms`);
  const html = await response.text();
  assert.match(html, /portfolio material, third-party materials/);
  assert.match(html, /testimonials are reviewed before publication/);
  assert.match(html, /To the extent permitted by applicable law/);
  assert.match(html, /dateTime="2026-09-25"/);
  assert.doesNotMatch(html, /All writing, photographs, projects, and personal content remain original/);
});
