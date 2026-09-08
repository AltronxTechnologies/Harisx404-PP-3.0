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

  assert.match(html, /href="https:\/\/github\.com\/harisx404"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(html, /href="\/resume"/);
  assert.match(html, /href="mailto:itsharis\.tech@gmail\.com"/);
  assert.doesNotMatch(html, /href="#"/);
  assert.ok((html.match(/<li/g) || []).length >= 8);
});
