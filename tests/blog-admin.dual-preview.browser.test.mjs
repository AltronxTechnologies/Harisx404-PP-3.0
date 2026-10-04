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
      console.log(JSON.stringify({ widths: 4, errors, writes, failures }));
      if (failures.length || errors || writes)
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
