import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
