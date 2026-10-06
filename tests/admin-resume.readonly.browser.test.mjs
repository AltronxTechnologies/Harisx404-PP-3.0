import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test(
  "Admin Resume renders the managed or fallback PDF and protects unsaved actions",
  { skip: process.env.RUN_CONNECTED_ADMIN_RESUME_REVIEW !== "1" },
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!url || !anon || !service || !email)
      throw new Error("Connected review unavailable");
    const browser = await chromium.launch({ headless: true });
    const cookies = new Map();
    let client;
    let revoked = false;
    try {
      const admin = createClient(url, service, {
        auth: { persistSession: false },
      });
      const { data: users, error: lookupError } =
        await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (
        lookupError ||
        !users.users.some((user) => user.email?.toLowerCase() === email)
      )
        throw new Error("Owner identity unavailable");
      const { data: link, error: linkError } =
        await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw new Error("Review session unavailable");
      client = createServerClient(url, anon, {
        cookies: {
          getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
          setAll: (updates) =>
            updates.forEach(({ name, value }) => cookies.set(name, value)),
        },
      });
      const { data: session, error: authError } = await client.auth.verifyOtp({
        token_hash: link.properties.hashed_token,
        type: "magiclink",
      });
      if (authError || session.user?.email?.toLowerCase() !== email)
        throw new Error("Owner identity mismatch");
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      await context.addCookies(
        [...cookies].map(([name, value]) => ({
          name,
          value,
          url: "http://localhost:3000",
        })),
      );
      const page = await context.newPage();
      const failures = [];
      let errors = 0,
        writes = 0,
        mockedWrites = 0,
        uploadAttempts = 0;
      page.on("pageerror", () => {
        errors++;
      });
      page.on("request", (request) => {
        if (
          request.method() !== "GET" &&
          new URL(request.url()).pathname === "/api/admin/resume"
        )
          writes++;
      });
      const response = await page.goto("http://localhost:3000/admin/resume", {
        waitUntil: "domcontentloaded",
      });
      if (response?.status() !== 200)
        throw new Error("Admin Resume unavailable");
      await page.getByRole("heading", { name: "Current document" }).waitFor();
      await page
        .getByRole("button", { name: "Show PDF preview" })
        .waitFor({ timeout: 15000 })
        .catch(() => failures.push("public-pdf-status-unavailable"));
      if (
        !(await page.getByRole("link", { name: /Open original PDF/ }).count())
      )
        failures.push("open-file-fallback");
      if (await page.locator("#resume-pdf-panel").count())
        failures.push("eager-pdf-download");
      if (
        await page.getByRole("button", { name: "Show PDF preview" }).count()
      ) {
        await page.getByRole("button", { name: "Show PDF preview" }).click();
        const frame = page.locator('iframe[title="Current Resume PDF"]');
        await frame.waitFor();
        if ((await frame.getAttribute("src")) !== "/resume/file")
          failures.push("pdf-preview-url");
        await page.getByRole("button", { name: "Hide PDF preview" }).click();
        if (await frame.count()) failures.push("preview-not-closed");
      }
      const uploadProbes = [];
      for (const port of [3000, 8080]) {
        for (const size of [8, 10 * 1024 * 1024 + 1]) {
          const result = await context.request.post(`http://localhost:${port}/api/admin/resume`, {
            multipart: { file: { name: "review-invalid.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(size, 65) } },
            timeout: 45000,
          });
          uploadProbes.push({ port, size: size === 8 ? "invalid-signature" : "over-limit", status: result.status(), json: result.headers()["content-type"]?.includes("application/json") ?? false });
        }
        const media = await context.request.post(`http://localhost:${port}/api/admin/media/upload`, {
          multipart: { file: { name: "review-invalid.txt", mimeType: "text/plain", buffer: Buffer.alloc(11 * 1024 * 1024, 65) } },
          timeout: 45000,
        });
        uploadProbes.push({ port, size: "invalid-media-over-10mb", status: media.status(), json: media.headers()["content-type"]?.includes("application/json") ?? false });
      }
      const prepared = await context.request.post("http://localhost:3000/api/admin/resume/prepare", {
        data: { filename: "review-not-uploaded.pdf", sizeBytes: 9 },
      });
      if (prepared.status() !== 200) failures.push({ kind: "signed-upload-grant-unavailable", status: prepared.status() });
      else {
        const grant = await prepared.json();
        if (!grant.token || !grant.path || !grant.proof) failures.push("signed-upload-grant-invalid");
        else {
          const storageUrl = new URL(`${url}/storage/v1/object/upload/sign/resume-documents/${grant.path}`);
          storageUrl.searchParams.set("token", grant.token);
          for (const origin of ["http://localhost:3000", "http://localhost:8080"]) {
            const cors = await context.request.fetch(storageUrl.toString(), { method: "OPTIONS", headers: {
              Origin: origin, "Access-Control-Request-Method": "PUT",
              "Access-Control-Request-Headers": "apikey,authorization,content-type,x-upsert",
            }, timeout: 15000 }).catch(() => null);
            if (!cors?.ok() || !cors.headers()["access-control-allow-origin"]) failures.push({ kind: "storage-preflight-unavailable", origin: new URL(origin).port, status: cors?.status() ?? 0 });
          }
          const { token: _token, ...proof } = grant;
          const forged = await context.request.post("http://localhost:3000/api/admin/resume/finish", { data: { ...proof, proof: proof.proof === "0".repeat(64) ? "1".repeat(64) : "0".repeat(64) } });
          if (forged.status() !== 400) failures.push("forged-grant-accepted");
          const missing = await context.request.post("http://localhost:3000/api/admin/resume/finish", { data: proof });
          if (missing.status() !== 400) failures.push("missing-upload-was-published");
        }
      }
      const mock = await context.newPage();
      let signedTransfers = 0;
      mock.on("pageerror", () => {
        errors++;
      });
      mock.on("request", (request) => {
        if (
          request.method() !== "GET" &&
          new URL(request.url()).pathname.startsWith("/api/admin/resume")
        )
          writes++;
      });
      await mock.route("**/api/admin/resume/prepare", (route) => {
        mockedWrites++;
        uploadAttempts++;
        return uploadAttempts === 1
          ? route.fulfill({ status: 503, json: { error: "Review upload unavailable" } })
          : uploadAttempts === 2
            ? route.fulfill({ status: 413, contentType: "text/html", body: "<html><body>Request too large</body></html>" })
            : route.fulfill({ json: { path: "documents/00000000-0000-4000-8000-000000000123.pdf", token: "review-only-token", filename: "review.pdf", sizeBytes: 9, expectedPath: null, expectedUpdatedAt: "2026-10-05T00:00:00.000Z", expiresAt: Date.now() + 60_000, proof: "f".repeat(64) } });
      });
      await mock.route("**/api/admin/resume/finish", (route) => { mockedWrites++; return route.fulfill({ json: { data: { isConfigured: true, isActive: true, filename: "review-updated.pdf", mimeType: "application/pdf", sizeBytes: 9, updatedAt: "2026-10-05T00:01:00.000Z" } } }); });
      await mock.route("**/storage/v1/**", (route) => {
        if (!route.request().url().includes("/object/upload/sign/")) return route.abort();
        signedTransfers++;
        return route.fulfill({ json: { Key: "review-only" } });
      });
      await mock.route("**/api/admin/resume", (route) => {
        if (route.request().method() === "GET")
          return route.fulfill({
            json: {
              data: {
                isConfigured: true,
                isActive: true,
                filename: "review-fixture.pdf",
                mimeType: "application/pdf",
                sizeBytes: 1024,
                updatedAt: "2026-10-05T00:00:00.000Z",
              },
            },
          });
        if (route.request().method() === "DELETE") {
          mockedWrites++;
          return route.fulfill({
            status: 503,
            json: { error: "Review delete unavailable" },
          });
        }
        return route.abort();
      });
      await mock.goto("http://localhost:3000/admin/resume", {
        waitUntil: "domcontentloaded",
      });
      await mock.getByRole("button", { name: "Delete live PDF" }).waitFor();
      await mock.getByRole("button", { name: "Delete live PDF" }).click();
      if (
        !(await mock
          .getByRole("dialog", { name: "Delete the live Resume?" })
          .count())
      )
        failures.push("delete-confirmation");
      await mock
        .getByRole("dialog", { name: "Delete the live Resume?" })
        .getByRole("button", { name: "Cancel" })
        .click();
      await mock
        .locator("#resume-upload")
        .setInputFiles({
          name: "review.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        });
      if (
        !(await mock
          .getByRole("dialog", { name: "Replace the live Resume?" })
          .count())
      )
        failures.push("replacement-confirmation");
      await mock
        .getByRole("dialog", { name: "Replace the live Resume?" })
        .getByRole("button", { name: "Replace PDF" })
        .click();
      await mock
        .getByRole("alert")
        .filter({ hasText: "Review upload unavailable" })
        .waitFor();
      if (
        !(await mock.getByText("review-fixture.pdf", { exact: true }).count())
      )
        failures.push("failed-upload-lost-current-file");
      await mock.locator("#resume-upload").setInputFiles({ name: "review.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
      await mock.getByRole("dialog", { name: "Replace the live Resume?" }).getByRole("button", { name: "Replace PDF" }).click();
      await mock.getByRole("alert").filter({ hasText: "request-size limit" }).waitFor();
      if (!(await mock.getByText("review-fixture.pdf", { exact: true }).count())) failures.push("html-upload-lost-current-file");
      if (!(await mock.getByRole("button", { name: "Refresh status" }).count())) failures.push("missing-upload-status-recovery");
      await mock.locator("#resume-upload").setInputFiles({ name: "review.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
      await mock.getByRole("dialog", { name: "Replace the live Resume?" }).getByRole("button", { name: "Replace PDF" }).click();
      await mock.getByText("review-updated.pdf", { exact: true }).waitFor({ timeout: 10000 }).catch(() => failures.push("signed-upload-workflow"));
      if (signedTransfers !== 1) failures.push("signed-transfer-not-called");
      await mock.getByRole("button", { name: "Delete live PDF" }).click();
      await mock
        .getByRole("dialog", { name: "Delete the live Resume?" })
        .getByRole("button", { name: "Delete PDF" })
        .click();
      await mock
        .getByRole("alert")
        .filter({ hasText: "Review delete unavailable" })
        .waitFor();
      if (
        !(await mock.getByText("review-updated.pdf", { exact: true }).count())
      )
        failures.push("failed-delete-lost-current-file");
      for (const width of [320, 390, 768, 1440]) {
        await mock.setViewportSize({ width, height: 900 });
        if (
          await mock.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )
        )
          failures.push(`overflow-${width}`);
      }
      const failed = await context.newPage();
      let attempts = 0;
      let retryAllowed = false;
      failed.on("pageerror", () => {
        errors++;
      });
      await failed.route("**/api/admin/resume", (route) => {
        attempts++;
        return !retryAllowed
          ? route.fulfill({
              status: 503,
              json: { error: "Review status unavailable" },
            })
          : route.fulfill({
              json: {
                data: {
                  isConfigured: false,
                  isActive: false,
                  filename: null,
                  mimeType: null,
                  sizeBytes: null,
                  updatedAt: "2026-10-05T00:00:00.000Z",
                },
              },
            });
      });
      await failed.goto("http://localhost:3000/admin/resume", {
        waitUntil: "domcontentloaded",
      });
      await failed.getByRole("button", { name: "Retry status" }).waitFor();
      if (!(await failed.locator("#resume-upload").isDisabled()))
        failures.push("failure-allows-upload");
      const beforeRetry = attempts;
      retryAllowed = true;
      await failed.getByRole("button", { name: "Retry status" }).click();
      await failed.getByRole("button", { name: "Show PDF preview" }).waitFor();
      if (attempts <= beforeRetry) failures.push("status-retry");
      console.log(
        JSON.stringify({
          widths: 4,
          errors,
          writes: writes - mockedWrites,
          mockedWrites,
          uploadProbes,
          failures,
        }),
      );
      if (errors || writes !== mockedWrites || failures.length)
        throw new Error("Read-only Admin Resume review failed");
      await context.close();
    } finally {
      await browser.close();
      if (client)
        try {
          const { error } = await client.auth.signOut({ scope: "local" });
          revoked = !error;
        } catch {
          /* Never revoke unrelated sessions. */
        }
      cookies.clear();
      console.log(JSON.stringify({ sessionRevoked: revoked }));
      if (client && !revoked)
        throw new Error("Review session could not be locally revoked");
    }
  },
);
