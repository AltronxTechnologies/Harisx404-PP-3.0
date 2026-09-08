import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.LINKS_BASE_URL || "http://localhost:3000";

test("Links renders the approved profile and destination groups", async () => {
  const response = await fetch(`${baseUrl}/links`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /One handle,/);
  assert.match(html, /Code &amp; craft/i);
  assert.match(html, /Send a message/);
  assert.match(html, /Profile link coming soon/);
  assert.match(html, /From concept to creation/);
  assert.doesNotMatch(html, /Book a Call/);
});

test("Links separates external, internal, email, and unavailable behavior", async () => {
  const response = await fetch(`${baseUrl}/links`);
  const html = await response.text();

  const nav = html.match(/<nav aria-label="Social and professional links"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, "Social links navigation should render");
  assert.equal((nav.match(/<li/g) || []).length, 8);

  const openingTag = (href) => {
    const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return nav.match(new RegExp(`<a[^>]*href="${escaped}"[^>]*>`))?.[0] || "";
  };
  [
    "https://github.com/harisx404",
    "https://tryhackme.com/p/harisx404",
    "https://www.credly.com/users/harisx404",
    "https://www.linkedin.com/in/harisx404/",
  ].forEach((href) => {
    const tag = openingTag(href);
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
  });

  ["/resume", "mailto:itsharis.tech@gmail.com", "/"].forEach((href) => {
    const tag = openingTag(href);
    assert.ok(tag, `${href} should render as a link`);
    assert.doesNotMatch(tag, /target="_blank"/);
  });
  assert.match(html, /href="\/contact"/);
  assert.doesNotMatch(nav, /href="#"/);
  assert.doesNotMatch(nav, /href="https:\/\/twitter\.com/);
});
