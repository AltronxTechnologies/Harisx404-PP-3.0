import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("Admin Media library renders, paginates and protects mocked actions", { skip: process.env.RUN_CONNECTED_ADMIN_MEDIA_REVIEW !== "1" }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !anon || !service || !email) throw new Error("Connected review unavailable");
  const browser = await chromium.launch({ headless: true });
  const cookies = new Map();
  let client;
  let context;
  let revoked = false;
  let pageErrors = 0;
  let mockedWrites = 0;
  let blockedWrites = 0;
  let stage = "auth";
  const failures = [];
  try {
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: users, error: lookupError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (lookupError || !users.users.some((user) => user.email?.toLowerCase() === email)) throw new Error("Owner identity unavailable");
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) throw new Error("Review session unavailable");
    client = createServerClient(url, anon, {
      cookies: {
        getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
        setAll: (updates) => updates.forEach(({ name, value }) => cookies.set(name, value)),
      },
    });
    const { data: session, error: authError } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
    if (authError || session.user?.email?.toLowerCase() !== email) throw new Error("Owner identity mismatch");
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: "http://localhost:3000" })));
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:3000" });
    context.on("page", (page) => page.on("pageerror", () => { pageErrors++; }));
    await context.route("**/*", (route) => {
      const method = route.request().method();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
      const path = new URL(route.request().url()).pathname;
      if (path === "/__nextjs_original-stack-frames") return route.continue();
      if (path === "/api/admin/media" && method === "DELETE") {
        mockedWrites++;
        return route.fulfill({ status: 409, json: { error: "Review image is in use" } });
      }
      if (path === "/api/admin/media" && method === "PATCH") {
        mockedWrites++;
        const body = JSON.parse(route.request().postData() || "{}");
        return route.fulfill({ status: 200, json: { data: { id: body.id, alt_text: body.alt_text } } });
      }
      if (path === "/api/admin/media/upload" && method === "POST") {
        mockedWrites++;
        return route.fulfill({ status: 200, json: { data: { id: "review-only-upload" }, warning: "Original filename migration pending" } });
      }
      blockedWrites++;
      return route.abort();
    });
    const page = await context.newPage();
    stage = "load";
    assert.equal((await page.goto("http://localhost:3000/admin/media", { waitUntil: "domcontentloaded" }))?.status(), 200);
    await page.getByRole("heading", { name: "Media Library" }).waitFor();
    await page.getByRole("status").filter({ hasText: /Showing .*files/ }).waitFor();
    assert.equal(await page.getByRole("alert").filter({ hasText: "Media could not be loaded" }).count(), 0);
    const response = await context.request.get("http://localhost:3000/api/admin/media?limit=12&offset=0");
    assert.equal(response.status(), 200);
    const library = await response.json();
    assert.ok(Array.isArray(library.data) && library.data.length > 0, "No connected media row to inspect");
    assert.ok(Number.isInteger(library.count) && library.count >= library.data.length);
    const first = library.data[0];
    const expectedName = first.original_filename || first.alt_text || `${first.public_id.split("/").pop() || "Image"}${first.format ? `.${first.format}` : ""}`;
    const firstCard = page.getByRole("article").first();
    assert.ok((await firstCard.textContent()).includes(expectedName), "Image name was not shown in full");
    if (Number.isFinite(first.bytes) && first.bytes >= 0) assert.ok((await firstCard.textContent()).includes(first.bytes.toLocaleString()), "Exact byte size missing");

    stage = "responsive";
    for (const [width, columns] of [[320, 1], [390, 1], [768, 3], [1280, 4], [1440, 4]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const metrics = await page.locator('section[aria-labelledby="media-list-heading"] > div.grid').evaluate((grid) => {
        const cards = [...grid.children];
        const buttons = cards.flatMap((card) => [...card.querySelectorAll("button")]);
        return {
          columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          short: buttons.filter((button) => button.getBoundingClientRect().height < 44 || button.getBoundingClientRect().width < 44).length,
          actions: cards.every((card) => card.querySelectorAll("button").length === 3),
        };
      });
      if (metrics.columns !== columns || metrics.overflow || metrics.short || !metrics.actions) failures.push(`layout-${width}:${JSON.stringify(metrics)}`);
      if (width === 320 && process.env.RUN_REDACTED_MEDIA_SCREENSHOT === "1") {
        await page.screenshot({ path: "/tmp/opencode/admin-media-mobile-redacted.png", animations: "disabled", maskColor: "#303036", mask: [page.locator(".admin-content article img"), page.locator(".admin-content article p"), page.locator(".admin-content article dd")] });
      }
    }
    if (process.env.RUN_REDACTED_MEDIA_SCREENSHOT === "1") {
      await page.screenshot({ path: "/tmp/opencode/admin-media-redacted.png", animations: "disabled", maskColor: "#303036", mask: [page.locator(".admin-content article img"), page.locator(".admin-content article p"), page.locator(".admin-content article dd")] });
    }

    stage = "pagination";
    if (library.count > 12) {
      stage = `pagination-next-${await page.getByRole("button", { name: "Next", exact: true }).count()}`;
      await page.getByRole("button", { name: "Next", exact: true }).click();
      stage = "page-two-load";
      await page.getByRole("status").filter({ hasText: /Showing 13-/ }).waitFor();
      stage = "page-two-ready";
      assert.equal(await page.getByRole("article").count(), Math.min(12, library.count - 12));
      stage = "page-two-count";
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      stage = "page-one-load";
      await page.getByRole("status").filter({ hasText: /Showing 1-/ }).waitFor();
    }

    stage = "copy";
    await page.getByRole("button", { name: `Copy link for ${expectedName}` }).first().click();
    await page.getByRole("button", { name: `Copy link for ${expectedName}` }).first().getByText("Copied").waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), first.secure_url || first.url, "Copied URL did not match the stored image");

    stage = "description";
    await page.getByRole("button", { name: `Edit description for ${expectedName}` }).first().click();
    const description = page.getByRole("dialog", { name: "Edit image description" });
    await description.waitFor();
    await description.getByRole("textbox", { name: "Image description" }).fill(" ");
    assert.equal(await description.getByRole("button", { name: "Save description" }).isDisabled(), true);
    assert.equal(mockedWrites, 0, "Blank description attempted a write");
    await description.getByRole("textbox", { name: "Image description" }).fill("Review-only description");
    await description.getByRole("button", { name: "Save description" }).click();
    await page.getByText(/description updated/i).first().waitFor();
    assert.equal(mockedWrites, 1);

    stage = "delete";
    const deleteButton = page.getByRole("button", { name: `Delete ${expectedName}` }).first();
    await deleteButton.click();
    const dialog = page.getByRole("dialog", { name: "Permanently delete image?" });
    await dialog.waitFor();
    assert.equal(await dialog.getByRole("button", { name: "Delete permanently" }).isDisabled(), true);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    assert.equal(mockedWrites, 1, "Cancelled deletion attempted a write");
    await deleteButton.click();
    await dialog.getByRole("textbox").fill("DELETE");
    await dialog.getByRole("button", { name: "Delete permanently" }).click();
    await page.getByRole("alert").filter({ hasText: "Review image is in use" }).waitFor();
    assert.equal(mockedWrites, 2);
    assert.equal(await deleteButton.count(), 1, "A failed delete removed the card");

    stage = "upload";
    await page.locator("#upload-input").setInputFiles({ name: "blocked.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>") });
    await page.getByRole("alert").filter({ hasText: "SVG is not accepted" }).waitFor();
    assert.equal(mockedWrites, 2, "Invalid SVG attempted an upload");
    await page.locator("#upload-input").setInputFiles({ name: "review-upload.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64") });
    await page.getByRole("alert").filter({ hasText: "Original filename migration pending" }).waitFor();
    assert.equal(mockedWrites, 3);
    assert.equal(blockedWrites, 0);
    assert.equal(pageErrors, 0);
    assert.deepEqual(failures, []);
  } catch {
    throw new Error("Admin Media review failed; see safe metrics");
  } finally {
    if (context) await context.close();
    await browser.close();
    if (client) {
      try { const { error } = await client.auth.signOut({ scope: "local" }); revoked = !error; } catch { /* Do not revoke unrelated sessions. */ }
    }
    cookies.clear();
    console.log(JSON.stringify({ stage, pageErrors, mockedWrites, blockedWrites, failures, sessionRevoked: revoked }));
    if (client && !revoked) throw new Error("Review session could not be locally revoked");
  }
});
