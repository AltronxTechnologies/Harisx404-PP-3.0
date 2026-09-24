import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.RESUME_BASE_URL || "http://localhost:3000";

test("Resume renders the approved web document and shared page handoff", async () => {
  const response = await fetch(`${baseUrl}/resume`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Experience, clearly/);
  assert.match(html, /Web resume/);
  assert.match(html, /3\.5\/4\.0 CGPA/);
  assert.match(html, /96% Cybersecurity coursework result/);
  assert.match(html, /KPITB AI\/ML Training Program/);
  assert.match(html, /From concept to creation/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  const heading = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0] || "";
  assert.ok(heading, "Resume should render one complete page heading");
  assert.doesNotMatch(heading, /<p/);
});

test("Resume PDF actions use one valid canonical asset", async () => {
  const [pageResponse, pdfResponse, metadata, resumeData] = await Promise.all([
    fetch(`${baseUrl}/resume`),
    fetch(`${baseUrl}/muhammad-haris-resume.pdf`),
    readFile(new URL("../app/data/siteMetadata.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/data/resume.ts", import.meta.url), "utf8"),
  ]);
  const html = await pageResponse.text();
  const signature = Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 5).toString();

  assert.equal(pdfResponse.status, 200);
  assert.match(pdfResponse.headers.get("content-type") || "", /application\/pdf/);
  assert.equal(signature, "%PDF-");
  assert.ok(Number(pdfResponse.headers.get("content-length")) > 100_000);
  assert.match(html, /download="Muhammad-Haris-Resume\.pdf"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(metadata, /resume: "\/muhammad-haris-resume\.pdf"/);
  assert.match(resumeData, /RESUME_PDF = "\/muhammad-haris-resume\.pdf"/);
  assert.doesNotMatch(metadata, /haris_resume\.pdf/);
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
