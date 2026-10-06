import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";
import test from "node:test";

test(
  "owner-only Blog editor modes and unsaved preview stay read-only",
  { skip: process.env.RUN_CONNECTED_ADMIN_BLOG_PREVIEW !== "1" },
  async () => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!base || !anon || !service || !email)
      throw new Error("Connected review unavailable");
    const browser = await chromium.launch({ headless: true });
    let client;
    let revoked = false;
    const cookies = new Map();
    try {
      const admin = createClient(base, service, {
        auth: { persistSession: false },
      });
      const { data: users, error: lookupError } =
        await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (
        lookupError ||
        !users.users.some((user) => user.email?.toLowerCase() === email)
      )
        throw new Error("Owner account not confirmed");
      const { data: link, error: linkError } =
        await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw new Error("Review session unavailable");
      client = createServerClient(base, anon, {
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
      let hydrationErrors = 0;
      context.on("page", (opened) => opened.on("console", (entry) => {
        if (entry.type() === "error" && /A tree hydrated but some attributes|hydration failed|server rendered HTML didn't match/i.test(entry.text())) hydrationErrors++;
      }));
      await context.addCookies(
        [...cookies].map(([name, value]) => ({
          name,
          value,
          url: "http://localhost:3000",
        })),
      );
      const page = await context.newPage();
      let errors = 0,
        writes = 0;
      page.on("pageerror", () => {
        errors++;
      });
      page.on("request", (request) => {
        if (
          request.method() !== "GET" &&
          new URL(request.url()).pathname === "/api/admin/blogs"
        )
          writes++;
      });
      const failures = [];
      const response = await page.goto(
        "http://localhost:3000/admin/blogs/new",
        { waitUntil: "domcontentloaded" },
      );
      if (response?.status() !== 200) throw new Error("New editor unavailable");
      await page.getByRole("heading", { name: "Create New Post" }).waitFor();
      const visual = page.getByRole("tab", { name: "Visual Editor" });
      const code = page.getByRole("tab", { name: "MDX / Code" });
      const preview = page.getByRole("tab", { name: "Preview" });
      if ((await visual.getAttribute("aria-selected")) !== "true")
        failures.push({ kind: "new-mode-default" });
      await page
        .getByRole("textbox", { name: "Title" })
        .fill("Unsaved preview review");
      await code.click();
      const input = page.getByRole("textbox", {
        name: "Blog article MDX source",
      });
      await input.waitFor();
      const original =
        '# Preview review\n\nA paragraph with **bold** text.\n\n<Callout emoji="!">Custom content survives.</Callout>';
      await input.fill(original);
      await preview.click();
      const article = page.locator("#blog-article");
      await article.waitFor({ timeout: 20000 }).catch(() => {});
      if (!(await article.count()))
        failures.push({
          kind: "unsaved-preview",
          errorShown: (await page.getByRole("alert").count()) > 0,
        });
      else if (
        !(await article.textContent())?.includes("Custom content survives")
      )
        failures.push({ kind: "custom-component-preview" });
      if (!(await code.count()))
        throw new Error(
          JSON.stringify({
            kind: "tabs-removed-after-preview",
            path: new URL(page.url()).pathname,
            articleCount: await article.count(),
            pageErrors: errors,
            errorShown: (await page.getByRole("alert").count()) > 0,
            newHeading: await page
              .getByRole("heading", { name: "Create New Post" })
              .count(),
            tabs: await page.getByRole("tab").count(),
            hasRuntimeOverlay:
              (await page.locator("nextjs-portal").count()) > 0,
          }),
        );
      await code.click();
      if ((await input.inputValue()) !== original)
        failures.push({ kind: "preview-mutated-source" });
      await visual.click();
      if (
        (await code.getAttribute("aria-selected")) !== "true" ||
        !(await page
          .getByRole("alert")
          .filter({ hasText: "cannot preserve safely" })
          .count())
      )
        failures.push({ kind: "lossy-switch-blocked" });
      const safe = "# Safe review\n\nA plain **paragraph**.";
      await input.fill(safe);
      await visual.click();
      const rich = page.locator(
        '[contenteditable="true"][aria-label="Blog article content"]',
      );
      await rich.waitFor({ timeout: 10000 }).catch(() => {});
      if (!(await rich.textContent())?.includes("A plain paragraph"))
        failures.push({ kind: "markdown-to-visual" });
      await code.click();
      if ((await input.inputValue()) !== safe)
        failures.push({ kind: "visual-roundtrip" });
      await preview.click();
      await article.waitFor({ timeout: 15000 }).catch(() => {});
      if (!(await article.textContent())?.includes("A plain paragraph"))
        failures.push({ kind: "rich-preview" });
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          tabs: [
            ...document.querySelectorAll(
              '[role="tablist"][aria-label="Blog writing mode"] [role="tab"]',
            ),
          ].map((tab) => ({
            fit: tab.getBoundingClientRect().right <= innerWidth + 1,
            height: tab.getBoundingClientRect().height,
          })),
          article:
            document.querySelector("#blog-article")?.getBoundingClientRect()
              .right <=
            innerWidth + 1,
        }));
        if (
          state.overflow ||
          state.tabs.length !== 3 ||
          state.tabs.some((tab) => !tab.fit || tab.height < 44) ||
          !state.article
        )
          failures.push({ kind: "responsive", width, ...state });
      }
      await page
        .getByRole("textbox", { name: "Title" })
        .fill("Updated unsaved preview review");
      await page.getByRole("button", { name: "Refresh preview" }).click();
      await page
        .getByRole("heading", { name: "Updated unsaved preview review" })
        .waitFor();
      await code.click();
      const invalid = "# Invalid review\n\n<UnknownComponent />";
      await input.fill(invalid);
      await code.focus();
      await page.keyboard.press("ArrowLeft");
      if (
        (await code.getAttribute("aria-selected")) !== "true" ||
        !(await code.evaluate((node) => node === document.activeElement))
      )
        failures.push({ kind: "blocked-keyboard-focus" });
      await preview.click();
      await page
        .getByRole("alert")
        .filter({ hasText: "cannot be safely previewed" })
        .waitFor({ timeout: 10000 })
        .catch(() => failures.push({ kind: "invalid-preview-error" }));
      if (!(await page.getByRole("alert").filter({ hasText: "unsupported JSX element <UnknownComponent>" }).count())) failures.push({ kind: "preview-reason-missing" });
      if (await article.count())
        failures.push({ kind: "invalid-preview-rendered" });
      await code.click();
      if ((await input.inputValue()) !== invalid)
        failures.push({ kind: "invalid-preview-mutated-source" });
      await page.setViewportSize({ width: 320, height: 900 });
      const codeState = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        editorFits:
          (document.querySelector(".admin-mdx-editor")?.getBoundingClientRect()
            .right ?? 9999) <=
          innerWidth + 1,
        highlighted:
          (document
            .querySelector(".admin-mdx-editor .w-md-editor-text-pre")
            ?.querySelectorAll("span").length ?? 0) > 0,
      }));
      if (codeState.overflow || !codeState.editorFits || !codeState.highlighted)
        failures.push({ kind: "source-mobile", ...codeState });
      const { data: sourceRows, error: sourceError } = await admin
        .from("blog_posts")
        .select("id,content")
        .eq("editor_mode", "source")
        .neq("status", "archived")
        .limit(1);
      if (sourceError) throw new Error("Existing source sample unavailable");
      if (sourceRows?.length) {
        const existing = await context.newPage();
        existing.on("pageerror", () => {
          errors++;
        });
        existing.on("request", (request) => {
          if (
            request.method() !== "GET" &&
            new URL(request.url()).pathname === "/api/admin/blogs"
          )
            writes++;
        });
        const existingResponse = await existing.goto(
          `http://localhost:3000/admin/blogs/${sourceRows[0].id}`,
          { waitUntil: "domcontentloaded" },
        );
        if (existingResponse?.status() !== 200)
          failures.push({ kind: "existing-source-unavailable" });
        else {
          await existing.getByRole("heading", { name: "Edit Post" }).waitFor();
          const existingCode = existing.getByRole("tab", {
            name: "MDX / Code",
          });
          const existingInput = existing.getByRole("textbox", {
            name: "Blog article MDX source",
          });
          await existingInput.waitFor();
          if (
            (await existingCode.getAttribute("aria-selected")) !== "true" ||
            (await existingInput.inputValue()) !== sourceRows[0].content
          )
            failures.push({ kind: "existing-source-changed" });
          await existing.getByRole("tab", { name: "Preview" }).click();
          await existing.getByRole("tab", { name: "MDX / Code" }).click();
          if ((await existingInput.inputValue()) !== sourceRows[0].content)
            failures.push({ kind: "existing-preview-mutated-source" });
        }
        await existing.close();
      }
      const ui = await context.newPage();
      ui.on("pageerror", () => {
        errors++;
      });
      ui.on("request", (request) => {
        if (
          request.method() !== "GET" &&
          new URL(request.url()).pathname === "/api/admin/blogs"
        )
          writes++;
      });
      const image = {
        id: "00000000-0000-4000-8000-000000000123",
        url: "/blog/blogfolio_v5.jpg",
        secure_url: "/blog/blogfolio_v5.jpg",
        alt_text: "Fixture art",
      };
      let mockedDeletes = 0;
      let mockedSaves = 0;
      let mockedUploads = 0;
      await ui.route("**/api/admin/blogs/images**", (route) =>
        route.fulfill({ json: { data: [], available: true } }),
      );
      await ui.route("**/api/admin/media?*", (route) => {
        if (route.request().method() === "DELETE") {
          mockedDeletes++;
          return route.fulfill({ json: { success: true } });
        }
        return route.fulfill({ json: { data: [image], count: 1 } });
      });
      await ui.route("**/api/admin/media/upload", (route) => {
        mockedUploads++;
        return route.fulfill({ json: { data: { id: `00000000-0000-4000-8000-00000000012${mockedUploads}`, url: "/blog/blogfolio_v5.jpg", secure_url: "/blog/blogfolio_v5.jpg", alt_text: `Uploaded ${mockedUploads}` } } });
      });
      await ui.goto("http://localhost:3000/admin/blogs/new", {
        waitUntil: "domcontentloaded",
      });
      await ui.getByRole("button", { name: "Add from library" }).waitFor();
      await ui
        .getByRole("textbox", { name: "Title" })
        .fill("Image workflow fixture");
      const canonical = ui.locator("#blog-canonical-url");
      if (
        (await canonical.inputValue()) !==
        "https://harisx404.vercel.app/blog/image-workflow-fixture"
      )
        failures.push({ kind: "automatic-canonical" });
      await ui.getByRole("textbox", { name: "Slug" }).fill("changed-fixture");
      if (
        (await canonical.inputValue()) !==
        "https://harisx404.vercel.app/blog/changed-fixture"
      )
        failures.push({ kind: "renamed-canonical" });
      await canonical.fill("https://publisher.example.com/original");
      if (
        (await canonical.inputValue()) !==
        "https://publisher.example.com/original"
      )
        failures.push({ kind: "external-canonical" });
      await ui.getByRole("button", { name: "Reset to site URL" }).click();
      if (
        (await canonical.inputValue()) !==
        "https://harisx404.vercel.app/blog/changed-fixture"
      )
        failures.push({ kind: "canonical-reset" });
      await ui.locator("#blog-status").click();
      await ui.getByRole("option", { name: "Published / Public" }).click();
      if (
        !(await ui.locator("#blog-status").textContent())?.includes(
          "Published / Public",
        )
      )
        failures.push({ kind: "status-published" });
      await ui.locator("#blog-status").click();
      await ui.getByRole("option", { name: "Draft / Private" }).click();
      await ui.locator("#blog-tag-input").fill("Security, AI, Testing,");
      if (
        (await ui
          .getByRole("button", { name: /^Remove (Security|AI|Testing) tag$/ })
          .count()) !== 3
      )
        failures.push({ kind: "comma-separated-tags" });
      await ui.getByRole("button", { name: "Publish date" }).click();
      await ui.getByRole("button", { name: "Next month" }).click();
      await ui.getByRole("button", { name: "Clear date" }).click();
      if (!(await ui.getByRole("button", { name: "Publish date" }).count()))
        failures.push({ kind: "calendar-closed" });
       await ui.getByRole("button", { name: "Add from library" }).click();
       if (await ui.getByRole("dialog", { name: "Choose an image" }).getByRole("button", { name: "Upload", exact: true }).count()) failures.push({ kind: "duplicate-upload-tab" });
       await ui
        .getByRole("dialog", { name: "Choose an image" })
        .getByRole("button", { name: "Fixture art" })
        .click();
      await ui.getByRole("button", { name: "Select Image" }).click();
      await ui.getByRole("button", { name: "Make cover" }).click();
      if ((await ui.locator("#blog-cover-url").inputValue()) !== image.url)
        failures.push({ kind: "cover-from-collection" });
       await ui.locator("#blog-cover-url").fill("");
       await ui.getByRole("button", { name: "Remove", exact: true }).click();
       const removeDialog = ui.getByRole("dialog", { name: "Permanently remove image?" });
       if (!(await removeDialog.getByRole("button", { name: "Remove permanently" }).isDisabled())) failures.push({ kind: "unguarded-image-delete" });
       await removeDialog.getByRole("textbox").fill("DELETE");
       await removeDialog.getByRole("button", { name: "Remove permanently" }).click();
       await ui
         .getByText("No managed images selected.", { exact: false })
        .waitFor();
      if (mockedDeletes !== 1)
        failures.push({ kind: "confirmed-delete-not-called" });
      const smallPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64");
      await ui.locator('section[aria-labelledby="blog-images-heading"] input[type="file"]').setInputFiles([
        { name: "review-one.png", mimeType: "image/png", buffer: smallPng },
        { name: "review-two.png", mimeType: "image/png", buffer: smallPng },
      ]);
      await ui.getByRole("region", { name: "Post image thumbnails" }).locator("img").nth(1).waitFor();
      if (mockedUploads !== 2) failures.push({ kind: "batch-upload-count" });
      for (const width of [320, 1440]) {
        await ui.setViewportSize({ width, height: 900 });
        const cards = ui.getByRole("region", { name: "Post image thumbnails" });
        const short = await cards.locator("button").evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().height < 44 || button.getBoundingClientRect().right > innerWidth + 1).length);
        if (short) failures.push({ kind: "image-actions-geometry", width, short });
        if (process.env.RUN_BLOG_IMAGE_SCREENSHOT === "1") await ui.locator('section[aria-labelledby="blog-images-heading"]').screenshot({ path: `/tmp/opencode/blog-images-${width}.png` });
      }
      await ui.setViewportSize({ width: 320, height: 900 });
      if (
        await ui.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        failures.push({ kind: "image-workspace-mobile" });
      await ui.getByRole("tab", { name: "MDX / Code" }).click();
      await ui
        .getByRole("textbox", { name: "Blog article MDX source" })
        .fill("# Draft check\n\nArticle content.");
      await ui.locator("#blog-status").click();
      await ui.getByRole("option", { name: "Published / Public" }).click();
      await ui.getByRole("button", { name: "Publish Post" }).click();
      if (
        !(await ui
          .getByRole("alert")
          .filter({ hasText: "Choose a cover image" })
          .count())
      )
        failures.push({ kind: "publish-cover-required" });
      await ui.locator("#blog-status").click();
      await ui.getByRole("option", { name: "Draft / Private" }).click();
      await ui.route("**/api/admin/blogs", (route) => {
        mockedSaves++;
        const body = route.request().postDataJSON();
        if (
          body.status !== "draft" ||
          body.published_at ||
          body.tags?.length !== 3 ||
          body.canonical_url !==
            "https://harisx404.vercel.app/blog/changed-fixture"
        )
          failures.push({ kind: "draft-payload" });
        return mockedSaves === 1
          ? route.fulfill({
              status: 503,
              json: { error: "Review save unavailable" },
            })
          : route.fulfill({
              json: {
                id: "00000000-0000-4000-8000-000000000123",
                slug: "changed-fixture",
              },
            });
      });
      await ui.getByRole("button", { name: "Save Draft" }).click();
      await ui
        .getByRole("alert")
        .filter({ hasText: "Review save unavailable" })
        .waitFor();
      if (
        !(
          await ui
            .getByRole("textbox", { name: "Blog article MDX source" })
            .inputValue()
        ).includes("Draft check")
      )
        failures.push({ kind: "failed-save-lost-content" });
      await ui.getByRole("button", { name: "Save Draft" }).click();
      await ui.waitForTimeout(350);
      if (mockedSaves !== 2) failures.push({ kind: "draft-not-retried" });
      await ui.close();
      console.log(
        JSON.stringify({
          widths: 4,
          errors,
          writes: writes - mockedSaves,
          mockedSaves,
          mockedUploads,
          hydrationErrors,
          failures,
        }),
      );
      if (failures.length || errors || hydrationErrors || writes !== mockedSaves)
        throw new Error("Blog read-only preview checks failed");
      await context.close();
    } finally {
      await browser.close();
      if (client)
        try {
          const { error } = await client.auth.signOut({ scope: "local" });
          revoked = !error;
        } catch {
          /* Never revoke other sessions. */
        }
      cookies.clear();
      console.log(JSON.stringify({ sessionRevoked: revoked }));
      if (client && !revoked)
        throw new Error("Review session could not be locally revoked");
    }
  },
);
