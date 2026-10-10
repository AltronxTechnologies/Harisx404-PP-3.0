import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readAdminResponse } from "../app/lib/admin/read-admin-response.ts";

test("unexpected HTML, oversized responses and expired sessions return actionable errors", async () => {
  await assert.rejects(readAdminResponse(new Response("<html>Too large</html>", { status: 413, headers: { "content-type": "text/html" } }), "Resume"), /HTTP 413.*even when the file is small/);
  await assert.rejects(readAdminResponse(new Response("<html>Too large</html>", { status: 413, headers: { "content-type": "text/html" } }), "Project image upload"), /Project image upload was rejected \(HTTP 413\)/);
  assert.deepEqual(await readAdminResponse(Response.json({ error: "Choose an image smaller than 20 MB" }, { status: 413 }), "Project image upload"), { error: "Choose an image smaller than 20 MB" });
  await assert.rejects(readAdminResponse(new Response("<html>Error</html>", { status: 502, headers: { "content-type": "text/html" } }), "Image upload"), /unexpected response \(502\)/);
  const redirected = new Response("<html>Login</html>", { headers: { "content-type": "text/html" } });
  Object.defineProperties(redirected, { redirected: { value: true }, url: { value: "http://localhost:3000/admin/login" } });
  await assert.rejects(readAdminResponse(redirected, "Resume"), /Admin session expired/);
  assert.deepEqual(await readAdminResponse(Response.json({ data: { ok: true } }), "Resume"), { data: { ok: true } });
});

test("Admin Resume previews only on demand and confirms destructive changes", async () => {
  const manager = await readFile(
    new URL("../app/components/admin/ResumeManager.tsx", import.meta.url),
    "utf8",
  );
  assert.match(manager, /const fallback = status\?\.isConfigured === false/);
  assert.match(
    manager,
    /const hasDocument = Boolean\(status\?\.isActive \|\| fallback\)/,
  );
  assert.match(manager, /previewOpen && <div id="resume-pdf-panel"/);
  assert.match(
    manager,
    /<iframe key=\{`\$\{status\.updatedAt\}-\$\{fallback\}`\} src=\{RESUME_FILE_ROUTE\}/,
  );
  assert.match(manager, /loading="lazy"/);
  assert.match(manager, /RESUME_DOWNLOAD_ROUTE/);
  assert.match(manager, /<AdminConfirmDialog open=\{pendingFile !== null\}/);
  assert.match(manager, /<AdminConfirmDialog open=\{deleteOpen\}/);
  assert.match(manager, /confirmText="DELETE"/);
  assert.doesNotMatch(manager, /window\.confirm\(/);
  assert.match(manager, /file\.size > RESUME_MAX_BYTES/);
  assert.match(manager, /type: "warning"/);
  assert.match(manager, /readAdminResponse\(response, "Resume"\)/);
});

test("Admin upload responses cannot expose raw HTML parse errors", async () => {
  const [reader, middleware, picker, library] = await Promise.all([
    readFile(new URL("../app/lib/admin/read-admin-response.ts", import.meta.url), "utf8"),
    readFile(new URL("../middleware.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/MediaPickerModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/media/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(reader, /content-type"\)\?\.includes\("application\/json"\)/);
  assert.match(reader, /response\.status === 413/);
  assert.match(reader, /Your Admin session expired/);
  assert.match(middleware, /api\/admin\/resume/);
  assert.match(middleware, /api\/admin\/media\/upload/);
  assert.match(picker, /readAdminResponse\(res, "Image upload"\)/);
  assert.match(library, /readAdminResponse\(res, "Image upload"\)/);
});

test("Resume API discloses incomplete storage cleanup without claiming the old file was removed", async () => {
  const api = await readFile(
    new URL("../app/api/admin/resume/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(api, /rollbackError/);
  assert.match(api, /cleanupWarning = true/);
  assert.match(
    api,
    /New Resume is saved, but the public page may take up to an hour to refresh/,
  );
  assert.match(api, /The old private file could not be removed/);
  assert.match(api, /\[storagePath\]/);
  assert.match(api, /auth\.getUser\(\)/);
});
