import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.CREDENTIALS_BASE_URL || "http://localhost:3000";

test("Credentials renders the admin-controlled collection", async () => {
  const response = await fetch(`${baseUrl}/credentials`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Evidence behind the/);
  assert.match(html, /Credential collection/);
  assert.match(html, /Professional learning with direct verification where available/);
  assert.match(html, /From concept to creation/);
  assert.doesNotMatch(html, /credly\.com\/users/);
  assert.equal((html.match(/<article/g) || []).length, 5);
  assert.doesNotMatch(html, /2026-08-01/);
  assert.doesNotMatch(html, /Pytest/);
  assert.doesNotMatch(html, /Completed Harvard CS50P/);
});

test("Credentials review seed contains the five supplied records", async () => {
  const seed = await readFile(
    new URL("../migrations/2026_credentials_review_seed.sql", import.meta.url),
    "utf8",
  );
  for (const title of [
    "CS50''s Introduction to Programming with Python",
    "Introduction to Cybersecurity",
    "AI Skills Fest 2026",
    "Delta 2.0: Full Stack Web Development",
    "Master Computer Networking",
  ]) {
    assert.match(seed, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(seed, /DELETE FROM public\.certifications WHERE is_demo = TRUE/);
  assert.match(seed, /ON CONFLICT \(issuer, title\) DO UPDATE/);
});

test("Credentials schema supports complete admin-managed records", async () => {
  const [page, migration] = await Promise.all([
    readFile(new URL("../app/credentials/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_certifications_expanded.sql", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /fallbackCertifications/);
  for (const column of [
    "issuer_logo_url", "badge_image_url", "credential_id", "expiration_date",
    "does_not_expire", "description", "skills", "category", "is_demo",
  ]) {
    assert.match(migration, new RegExp(column));
  }
  assert.match(migration, /Demo record|is_demo/);
});

test("Certification admin API rejects unauthenticated access", async () => {
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/certifications`, { method });
    assert.equal(response.status, 401, `${method} should require admin authentication`);
  }
});
