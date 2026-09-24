import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.RESUME_BASE_URL || "http://localhost:3000";

test("Resume renders the published PDF experience without the old web document", async () => {
  const response = await fetch(`${baseUrl}/resume`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Experience, clearly/);
  assert.match(html, /The current Resume/);
  assert.match(html, /href="\/resume\/file\?download=1/);
  assert.match(html, /href="\/resume\/file\?v=/);
  assert.match(html, /From concept to creation/);
  assert.doesNotMatch(html, />Web resume</);
  assert.doesNotMatch(html, /Professional Summary|Technical Expertise/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
});

test("Resume file endpoint preserves PDF bytes and download metadata", async () => {
  const [fileResponse, fallbackBytes, metadata] = await Promise.all([
    fetch(`${baseUrl}/resume/file?download=1`),
    readFile(new URL("../public/muhammad-haris-resume.pdf", import.meta.url)),
    readFile(new URL("../app/data/siteMetadata.ts", import.meta.url), "utf8"),
  ]);
  const responseBytes = Buffer.from(await fileResponse.arrayBuffer());

  assert.equal(fileResponse.status, 200);
  assert.match(fileResponse.headers.get("content-type") || "", /application\/pdf/);
  assert.match(fileResponse.headers.get("content-disposition") || "", /^attachment;/);
  assert.match(fileResponse.headers.get("content-disposition") || "", /Muhammad-Haris-Resume\.pdf/);
  assert.equal(responseBytes.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(responseBytes, fallbackBytes);
  assert.match(metadata, /resume: "\/resume\/file"/);
  assert.doesNotMatch(metadata, /haris_resume\.pdf/);
});

test("Resume Admin API fails closed without an authenticated administrator", async () => {
  for (const method of ["GET", "POST", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/resume`, { method });
    assert.equal(response.status, 401, `${method} should reject unauthenticated access`);
  }
});

test("Resume management and arbitrary-page rendering contracts are enforced", async () => {
  const [api, migration, viewer, manager, publicData] = await Promise.all([
    readFile(new URL("../app/api/admin/resume/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_resume_document.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/components/resume/ResumePdfViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ResumeManager.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/resume/data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(api, /auth\.getUser\(\)/);
  assert.match(api, /ADMIN_EMAIL/);
  assert.match(api, /TextDecoder\("ascii"\)/);
  assert.match(api, /crypto\.randomUUID\(\)/);
  assert.match(api, /\.remove\(\[current\.storage_path\]\)/);
  assert.match(api, /revalidateTag\("resume"\)/);
  assert.match(api, /export async function DELETE/);
  assert.match(migration, /public\.resume_document/);
  assert.match(migration, /public = FALSE/);
  assert.match(migration, /allowed_mime_types/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.resume_document FROM anon, authenticated/);
  assert.match(viewer, /Array\.from\(\{ length: pages \}/);
  assert.match(viewer, /onLoadSuccess=\{\(\{ numPages \}\)/);
  assert.match(viewer, /ResizeObserver/);
  assert.match(manager, /Choose replacement PDF/);
  assert.match(manager, /method: "DELETE"/);
  assert.match(publicData, /updatedAt: data\.updated_at/);
});

test("Resume has route-matched loading and recovery states", async () => {
  const [loading, error] = await Promise.all([
    readFile(new URL("../app/resume/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/resume/error.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(loading, /Loading resume/);
  assert.match(loading, /motion-reduce:animate-none/);
  assert.match(error, /Resume unavailable/);
  assert.match(error, /headingRef\.current\?\.focus/);
  assert.match(error, /Open PDF/);
  assert.match(error, /Try again/);
});
