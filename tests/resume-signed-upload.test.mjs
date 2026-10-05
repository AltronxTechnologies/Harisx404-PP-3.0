import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("signed Resume transfer is scoped, authorized and does not publish without server verification", async () => {
  const [prepare, finish, grant, manager] = await Promise.all([
    readFile(new URL("../app/api/admin/resume/prepare/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/resume/finish/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/admin/resume-upload-grant.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/ResumeManager.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(prepare, /const auth = await requireAdmin\(\)/);
  assert.match(prepare, /createSignedUploadUrl\(grant\.path\)/);
  assert.match(grant, /createHmac\("sha256"/);
  assert.match(grant, /timingSafeEqual/);
  assert.match(finish, /const auth = await requireAdmin\(\)/);
  assert.match(finish, /validResumeGrant\(parsed\.data\)/);
  assert.match(finish, /storage\.download\(grant\.path\)/);
  assert.match(finish, /bytes\.byteLength !== grant\.sizeBytes/);
  assert.match(finish, /TextDecoder\("ascii"\)/);
  assert.match(finish, /mutation = grant\.expectedPath \? mutation\.eq\("storage_path", grant\.expectedPath\)/);
  assert.match(finish, /winner\?\.storage_path === grant\.path/);
  assert.doesNotMatch(finish, /storage\.remove\(\[grant\.path\]\)/);
  assert.match(manager, /uploadToSignedUrl\(grant\.path, grant\.token, pdf/);
  assert.match(manager, /cacheControl: "0"/);
  assert.doesNotMatch(manager, /formData\.append\("file", pendingFile\)/);
});

test("signed Resume endpoints reject unauthenticated callers before changing Storage", async () => {
  const base = process.env.RESUME_BASE_URL || "http://localhost:3000";
  for (const route of ["prepare", "finish"]) {
    const response = await fetch(`${base}/api/admin/resume/${route}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(response.status, 401, `${route} must require the Admin account`);
  }
});
