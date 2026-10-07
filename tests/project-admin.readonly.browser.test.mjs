import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test(
  "Admin Projects list and unsaved form interactions are safe at responsive widths",
  { skip: process.env.RUN_CONNECTED_ADMIN_PROJECT_REVIEW !== "1" },
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
      let errors = 0,
        writes = 0,
        mockedWrites = 0;
      page.on("pageerror", () => {
        errors++;
      });
      page.on("request", (request) => {
        if (
          request.method() !== "GET" &&
          new URL(request.url()).pathname.startsWith("/api/admin/projects")
        )
          writes++;
      });
      const failures = [];
      const list = await page.goto(
        "http://localhost:3000/admin/projects?q=unlikely-project-review-unique&status=draft",
        { waitUntil: "domcontentloaded" },
      );
      await page
        .getByRole("heading", { name: "Projects" })
        .waitFor({ timeout: 10000 })
        .catch(() => {});
      if (
        list?.status() !== 200 ||
        !(await page.getByRole("heading", { name: "Projects" }).count())
      )
        failures.push("list");
      await page
        .getByRole("status")
        .filter({ hasText: "Showing 0 projects" })
        .waitFor({ timeout: 10000 })
        .catch(() => {});
      if (
        !(await page
          .getByRole("status")
          .filter({ hasText: "Showing 0 projects" })
          .count())
      )
        failures.push({
          kind: "filtered-count",
          errorShown: (await page.getByRole("alert").count()) > 0,
        });
      await page.goto("http://localhost:3000/admin/projects", { waitUntil: "domcontentloaded" });
      await page.getByRole("status").filter({ hasText: /Showing 1-/ }).waitFor();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(100);
        const cards = page.locator("article").filter({ has: page.locator('a[aria-label^="Edit "]') });
        if (width < 1280) {
          if (!(await cards.count())) failures.push(`mobile-project-cards-${width}`);
          const geometry = await cards.locator("a,button").evaluateAll((controls) => controls.map((control) => ({ width: control.getBoundingClientRect().width, height: control.getBoundingClientRect().height, right: control.getBoundingClientRect().right })).filter((control) => control.width < 44 || control.height < 44 || control.right > innerWidth + 1));
          if (geometry.length) failures.push({ kind: "mobile-project-actions", width, count: geometry.length, sample: geometry[0] });
        } else if (!(await page.getByRole("region", { name: "Projects table" }).isVisible())) failures.push("desktop-project-table");
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) failures.push(`list-overflow-${width}`);
        if (process.env.RUN_REDACTED_PROJECT_SCREENSHOT === "1" && (width === 320 || width === 1440)) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: `/tmp/opencode/admin-projects-${width}-redacted.png`, maskColor: "#303036", mask: [page.locator(".admin-content article span"), page.locator(".admin-content article p"), page.locator(".admin-content td")] });
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      const first =
        "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png";
      const fixtures = [
        first,
        `${first}?review=second`,
        `${first}?review=third`,
      ].map((src, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index + 1}`,
        url: src,
        secure_url: src,
        alt_text: `Review image ${index + 1}`,
      }));
      let mockedUpload = 0;
      let mockedCleanup = 0;
      await page.route("**/api/admin/media?*", (route) => {
        if (route.request().method() === "DELETE") {
          mockedCleanup++;
          return mockedCleanup === 1 ? route.fulfill({ status: 409, json: { error: "Review asset is referenced" } }) : route.fulfill({ json: { success: true } });
        }
        return route.fulfill({ json: { data: fixtures, count: fixtures.length } });
      });
      await page.route("**/api/admin/media/upload", (route) => {
        mockedUpload++;
        return route.fulfill({ json: { data: { id: "00000000-0000-4000-8000-000000000099", url: first, secure_url: first, alt_text: "Unsaved review image" } } });
      });
      const editor = await page.goto(
        "http://localhost:3000/admin/projects/new",
        { waitUntil: "domcontentloaded" },
      );
      if (editor?.status() !== 200)
        throw new Error("Project editor unavailable");
      await page.getByRole("heading", { name: "Create New Project" }).waitFor();
      await page.locator('[contenteditable="true"][aria-label="Case study"]').waitFor({ timeout: 15000 });
      await page.locator("#project-title").fill("Project review");
      if (
        (await page.locator("#project-slug").inputValue()) !== "project-review"
      )
        failures.push("auto-slug");
      await page.locator("#project-slug").fill("Invalid Slug");
      await page.getByRole("button", { name: "Save Project" }).click();
      if (!(await page.locator("#project-slug-error").count()))
        failures.push("slug-validation");
      await page.locator("#project-slug").fill("project-review");
      await page.locator("#project-live-url").fill("javascript:alert(1)");
      await page.getByRole("button", { name: "Save Project" }).click();
      if (!(await page.locator("#project-live-url-error").count())) failures.push("unsafe-url-validation");
      await page.locator("#project-live-url").fill("");
      const selectImage = async (label) => {
        await page
          .getByRole("dialog", { name: "Choose an image" })
          .getByRole("button", { name: label })
          .click();
        await page.getByRole("button", { name: "Select Image" }).click();
      };
      await page.getByRole("button", { name: "Choose from library" }).click();
      await selectImage("Review image 1");
      await page.locator("#project-cover-caption").fill("Old cover caption");
      await page.locator("#project-cover-alt").fill("Old cover description");
      await page
        .getByRole("button", { name: "Add from Media Library" })
        .click();
      await selectImage("Review image 2");
      await page
        .getByRole("button", { name: "Make cover (first image)" })
        .click();
      if (
        (await page.locator("#project-cover-url").inputValue()) !==
        fixtures[1].url
      )
        failures.push("promoted-cover");
      if (
        (await page
          .getByRole("textbox", { name: "Caption", exact: true })
          .inputValue()) !== "Old cover caption"
      )
        failures.push("old-cover-caption-lost");
      if (
        (await page
          .getByRole("textbox", {
            name: "Image description for screen readers (optional, up to 160 characters)",
            exact: true,
          })
          .inputValue()) !== "Old cover description"
      )
        failures.push("old-cover-alt-lost");
      await page.getByRole("button", { name: "Choose from library" }).click();
      await selectImage("Review image 3");
      if (
        (await page.locator("#project-cover-url").inputValue()) !==
        fixtures[2].url
      )
        failures.push("picker-replacement-cover");
      if (
        (await page
          .getByRole("textbox", { name: "Caption", exact: true })
          .count()) !== 2
      )
        failures.push("picker-replacement-dropped-cover");
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(100);
        const measure = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('.admin-content input[id^="project-"]:not([type="hidden"]):not([type="checkbox"]), .admin-content textarea[id^="project-"], .admin-content button[aria-label^="Move image"], .admin-content button[aria-label^="Replace image"], .admin-content button[aria-label^="Remove image"]')].filter((control) => control.getBoundingClientRect().height > 0);
          const short = controls.filter((control) => control.getBoundingClientRect().height < 44 || control.getBoundingClientRect().right > innerWidth + 1);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, short: short.length, sample: short[0]?.id || short[0]?.getAttribute("aria-label") || "" };
        });
        if (measure.overflow || measure.short) failures.push({ kind: "editor-geometry", width, ...measure });
      }
      await page.route("**/api/admin/projects", (route) => {
        mockedWrites++;
        return route.fulfill({
          status: 400,
          json: {
            error: "Invalid project data",
            issues: { fieldErrors: { title: ["Check the project title"] } },
          },
        });
      });
      await page.getByRole("button", { name: "Save Project" }).click();
      await page
        .locator("#project-title-error")
        .waitFor({ timeout: 10000 })
        .catch(() => failures.push("server-field-feedback"));
      if (mockedWrites !== 1) failures.push("mocked-save-not-sent");
      await page.getByRole("button", { name: "Cancel" }).click();
      if (
        !(await page
          .getByRole("dialog", { name: "Discard unsaved project changes?" })
          .count())
      )
        failures.push("unsaved-cancel");
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await page.getByRole("button", { name: "Upload replacement" }).click();
      await page.getByRole("dialog", { name: "Choose an image" }).locator('input[type="file"]').setInputFiles({ name: "unsaved-project.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64") });
      await page.getByRole("button", { name: "Close media picker" }).click();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      const discard = page.getByRole("dialog", { name: "Discard unsaved project changes?" });
      await discard.getByRole("button", { name: "Discard changes" }).click();
      await page.getByRole("alert").filter({ hasText: "1 uploaded image(s) could not be removed" }).waitFor();
      if (new URL(page.url()).pathname !== "/admin/projects/new") failures.push("failed-cleanup-left-editor");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await discard.getByRole("button", { name: "Discard changes" }).click();
      await page.waitForURL("**/admin/projects");
      if (mockedUpload !== 1 || mockedCleanup !== 2) failures.push({ kind: "unsaved-project-upload-cleanup", mockedUpload, mockedCleanup });
      const saveOrder = [];
      await page.route("**/api/admin/media?*", (route) => {
        if (route.request().method() === "DELETE") {
          saveOrder.push("cleanup");
          return route.fulfill({ json: { success: true } });
        }
        return route.fulfill({ json: { data: fixtures, count: fixtures.length } });
      });
      await page.route("**/api/admin/media/upload", (route) => {
        saveOrder.push("upload");
        return route.fulfill({ json: { data: { id: "00000000-0000-4000-8000-000000000098", url: `${first}?unsaved=1`, secure_url: `${first}?unsaved=1`, alt_text: "Unused review image" } } });
      });
      await page.route("**/api/admin/projects", (route) => {
        mockedWrites++;
        saveOrder.push("save");
        return route.fulfill({ status: 503, json: { error: "Review save unavailable" } });
      });
      await page.goto("http://localhost:3000/admin/projects/new", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Create New Project" }).waitFor();
      await page.locator("#project-title").fill("Unsaved project review");
      await page.getByRole("button", { name: "Choose from library" }).click();
      await selectImage("Review image 1");
      await page.getByRole("button", { name: "Upload replacement" }).click();
      await page.getByRole("dialog", { name: "Choose an image" }).locator('input[type="file"]').setInputFiles({ name: "unused-project.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64") });
      await page.getByRole("button", { name: "Close media picker" }).click();
      await page.getByRole("button", { name: "Save Project" }).click();
      await page.getByRole("alert").filter({ hasText: "Review save unavailable" }).waitFor();
      if (JSON.stringify(saveOrder) !== JSON.stringify(["upload", "cleanup", "save"])) failures.push({ kind: "unused-upload-before-save", saveOrder });
      console.log(
        JSON.stringify({
          widths: 4,
          errors,
          writes: writes - mockedWrites,
          mockedWrites,
          mockedUpload,
          mockedCleanup,
          failures,
        }),
      );
      if (errors || writes !== mockedWrites || failures.length)
        throw new Error("Admin Projects read-only review failed");
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
