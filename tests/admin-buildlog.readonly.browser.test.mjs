import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test(
  "Admin Buildlog list, editor, and settings connected read-only review",
  { skip: process.env.RUN_CONNECTED_ADMIN_BUILDLOG_REVIEW !== "1" },
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!url || !anon || !service || !email)
      throw new Error("Connected review unavailable");

    // Launch before generating any owner link, so a missing browser cannot mint a session.
    const browser = await chromium.launch({ headless: true });
    const cookies = new Map();
    let client;
    let context;
    let revoked = false;
    let pageErrors = 0;
    let attemptedWrites = 0;
    let mockedWrites = 0;
    let blockedWrites = 0;
    let editReviewed = false;
    let stage = "load";
    const failures = [];
    const base = "http://localhost:3000";
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

      context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      await context.addCookies(
        [...cookies].map(([name, value]) => ({ name, value, url: base })),
      );
      context.on("page", (page) =>
        page.on("pageerror", () => {
          pageErrors++;
        }),
      );
      // Installed before any navigation or click: never forward a browser write.
      await context.route("**/*", (route) => {
        const method = route.request().method();
        if (["GET", "HEAD", "OPTIONS"].includes(method))
          return route.continue();
        const path = new URL(route.request().url()).pathname;
        if (path === "/__nextjs_original-stack-frames") return route.continue();
        attemptedWrites++;
        if (path === "/api/admin/buildlog" && method === "POST") {
          mockedWrites++;
          return route.fulfill({
            status: 400,
            json: {
              error: "Review project save unavailable",
              issues: { fieldErrors: { name: ["Review name feedback"] } },
            },
          });
        }
        if (
          path === "/api/admin/buildlog" &&
          ["PUT", "DELETE"].includes(method)
        ) {
          mockedWrites++;
          return route.fulfill({
            status: 503,
            json: { error: "Review mutation unavailable" },
          });
        }
        blockedWrites++;
        failures.push(`blocked-${method}-${path}`);
        return route.abort();
      });
      stage = "list-navigation";

      const checkWidths = async (page, surface) => {
        for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(250);
          const metrics = await page.evaluate(() => {
            const controls = [
              ...document.querySelectorAll(
                '.admin-content input:not([type="hidden"]):not([type="checkbox"]), .admin-content textarea, .admin-content select, .admin-content button, .admin-content a',
              ),
            ].filter((element) => {
              const rect = element.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                getComputedStyle(element).visibility !== "hidden"
              );
            });
            return {
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
              darkTheme: document.querySelector("[data-admin-root].dark") !== null && getComputedStyle(document.querySelector("[data-admin-root]")).backgroundColor === "rgb(13, 13, 15)",
              uniqueIds: (() => { const ids = [...document.querySelectorAll(".admin-content [id]")].filter((element) => element.getClientRects().length > 0).map((element) => element.id); return ids.length === new Set(ids).size; })(),
              formWidths: [
                ...document.querySelectorAll(".admin-content form"),
              ].map((form) => Math.round(form.getBoundingClientRect().width)),
              shortControls: controls
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return rect.width < 44 || rect.height < 44;
                })
                .map((element) => ({
                  tag: element.tagName,
                  width: Math.round(element.getBoundingClientRect().width),
                  height: Math.round(element.getBoundingClientRect().height),
                })),
              checkedControls: controls.length,
            };
          });
          if (metrics.overflow) failures.push(`${surface}-overflow-${width}`);
          if (!metrics.darkTheme) failures.push(`${surface}-theme-${width}`);
          if (!metrics.uniqueIds) failures.push(`${surface}-duplicate-ids-${width}`);
          if (!metrics.formWidths.some((formWidth) => formWidth > 100))
            failures.push(
              `${surface}-missing-visible-form-${width}:${metrics.formWidths.join(",")}`,
            );
          if (!metrics.checkedControls || metrics.shortControls.length)
            failures.push(
              `${surface}-44px-${width}:${JSON.stringify(metrics.shortControls)}/${metrics.checkedControls}`,
            );
        }
      };

      const list = await context.newPage();
      const filtered = await list.goto(
        `${base}/admin/buildlog?q=${encodeURIComponent(`review-no-match-${randomUUID()}`)}`,
        { waitUntil: "domcontentloaded" },
      );
      assert.equal(
        filtered?.status(),
        200,
        "Filtered Buildlog list unavailable",
      );
      await list
        .getByRole("heading", { name: "Buildlog", exact: true })
        .waitFor();
      await list
        .getByRole("status")
        .filter({ hasText: "Showing 0 projects" })
        .waitFor();
      assert.equal(
        await list
          .getByRole("alert")
          .filter({ hasText: "Buildlog projects could not be loaded" })
          .count(),
        0,
        "Filtered list load failed",
      );
      await list.locator("#buildlog-list-status").click();
      const listOption = list.getByRole("option", { name: "Draft" });
      await listOption.waitFor();
      if (await listOption.evaluate((element) => element.getBoundingClientRect().height < 44)) failures.push("list-dropdown-target");
      await listOption.click();
      const submittedStatus = await list.locator('input[name="status"]').inputValue();
      if (submittedStatus !== "draft") failures.push("list-hidden-status-not-draft");
      await list.getByRole("button", { name: "Apply" }).click();
      stage = "list-filter-submit";
      await list.waitForURL(/status=draft/, { waitUntil: "commit" });
      await list.getByRole("status").filter({ hasText: "Showing 0 projects" }).waitFor({ timeout: 10000 }).catch(() => failures.push("list-dropdown-filter"));
      await checkWidths(list, "filtered-list");

      const unfiltered = await list.goto(`${base}/admin/buildlog`, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(unfiltered?.status(), 200, "Buildlog list unavailable");
      await list
        .getByRole("status")
        .filter({ hasText: /Showing / })
        .waitFor();
      await checkWidths(list, "list");
      const editHref = await list
        .locator('a[href^="/admin/buildlog/"][aria-label^="Edit "]')
        .first()
        .getAttribute("href")
        .catch(() => null);
      if (
        !editHref &&
        !(await list
          .getByRole("status")
          .filter({ hasText: "Showing 0 projects" })
          .count())
      )
        failures.push("existing-edit-link-missing");
      if (editHref) {
        await list
          .locator('button[aria-label^="Delete "]:visible')
          .first()
          .click();
        const deleteDialog = list.getByRole("dialog", {
          name: "Permanently delete Buildlog project?",
        });
        await deleteDialog.waitFor();
        await deleteDialog.getByRole("button", { name: "Cancel" }).click();
        assert.equal(attemptedWrites, 0, "Cancelled delete attempted a write");
        const edit = await context.newPage();
        const response = await edit.goto(`${base}${editHref}`, {
          waitUntil: "domcontentloaded",
        });
        assert.equal(
          response?.status(),
          200,
          "Existing Buildlog editor unavailable",
        );
        await edit
          .getByRole("heading", { name: "Edit Buildlog project" })
          .waitFor();
        assert.ok(
          await edit.getByRole("button", { name: "Update project" }).count(),
        );
        await checkWidths(edit, "edit");
        editReviewed = true;
      }

      stage = "new-form-navigation";
      const form = await context.newPage();
      const newResponse = await form.goto(`${base}/admin/buildlog/new`, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(
        newResponse?.status(),
        200,
        "New Buildlog editor unavailable",
      );
      await form
        .getByRole("heading", { name: "Create Buildlog project" })
        .waitFor();
      await form.getByRole("button", { name: "Create project" }).click();
      await form.locator("#buildlog-name-error").waitFor();
      await form.locator("#buildlog-item-0-title-error").waitFor();
      assert.equal(attemptedWrites, 0, "Invalid form attempted a write");
      await form.locator("#buildlog-status").click();
      await form.getByRole("option", { name: /^Published/ }).click();
      if (!(await form.locator("#buildlog-status").textContent())?.includes("Published")) failures.push("form-visibility-dropdown");
      await form.locator("#buildlog-status").click();
      await form.getByRole("option", { name: /^Draft/ }).click();
      await form.locator("#buildlog-lifecycle").click();
      await form.getByRole("option", { name: /^Live/ }).click();
      if (!(await form.locator("#buildlog-lifecycle").textContent())?.includes("Live")) failures.push("form-lifecycle-dropdown");
      await form.locator("#buildlog-lifecycle").click();
      await form.getByRole("option", { name: /^In progress/ }).click();
      stage = "lifecycle-keyboard";
      await form.locator("#buildlog-lifecycle").focus();
      await form.keyboard.press("ArrowDown");
      await form.getByRole("option", { name: /^In progress/ }).waitFor();
      await form.keyboard.press("ArrowDown");
      await form.locator('[role="option"][data-focus]').filter({ hasText: "Live" }).waitFor({ timeout: 5000 }).catch(() => failures.push("keyboard-lifecycle-focus"));
      await form.keyboard.press("Enter");
      if (!(await form.locator("#buildlog-lifecycle").textContent())?.includes("Live")) failures.push("keyboard-lifecycle-selection");
      await form.locator("#buildlog-lifecycle").click();
      await form.getByRole("option", { name: /^In progress/ }).click();
      await form
        .getByRole("textbox", { name: "Project name" })
        .fill("Review only project");
      await form
        .getByRole("textbox", { name: "Tagline" })
        .fill("Review only tagline");
      await form
        .getByRole("textbox", { name: "Project summary" })
        .fill("Review only project summary.");
      await form
        .getByRole("textbox", { name: "Title" })
        .fill("First review item");
      await form.getByRole("button", { name: "Add item" }).click();
      await form
        .getByRole("textbox", { name: "Title" })
        .nth(1)
        .fill("Second review item");
      await form.getByRole("button", { name: "Move item 2 up" }).click();
      assert.equal(
        await form.getByRole("textbox", { name: "Title" }).first().inputValue(),
        "Second review item",
      );
      assert.equal(
        await form.getByRole("textbox", { name: "Title" }).nth(1).inputValue(),
        "First review item",
      );
      await form.getByRole("spinbutton", { name: "Display order" }).fill("");
      await form.getByRole("button", { name: "Create project" }).click();
      await form.locator("#buildlog-display-order-error").waitFor();
      assert.equal(mockedWrites, 0, "Blank display order attempted a write");
      await form.getByRole("spinbutton", { name: "Display order" }).fill("0");
      await checkWidths(form, "new");
      await form.getByRole("button", { name: "Create project" }).click();
      await form
        .getByRole("alert")
        .filter({ hasText: "Review project save unavailable" })
        .waitFor();
      await form
        .locator("#buildlog-name-error")
        .filter({ hasText: "Review name feedback" })
        .waitFor();
      assert.equal(
        mockedWrites,
        1,
        "Mocked project save not attempted exactly once",
      );
      await form.getByRole("button", { name: "Cancel" }).click();
      const discard = form.getByRole("dialog", {
        name: "Discard unsaved Buildlog changes?",
      });
      await discard.waitFor();
      await discard.getByRole("button", { name: "Cancel" }).click();
      assert.equal(
        await form
          .getByRole("heading", { name: "Create Buildlog project" })
          .count(),
        1,
      );
      await form.locator('a[href="/admin"]:visible').first().click();
      await discard.waitFor();
      await discard.getByRole("button", { name: "Cancel" }).click();
      assert.equal(new URL(form.url()).pathname, "/admin/buildlog/new", "Sidebar navigation discarded unsaved project edits");
      await form.locator('button:has-text("Sign Out"):visible').first().click();
      await discard.waitFor();
      await discard.getByRole("button", { name: "Cancel" }).click();
      assert.equal(new URL(form.url()).pathname, "/admin/buildlog/new", "Sign Out bypassed unsaved project warning");

      const settings = await context.newPage();
      const settingsResponse = await settings.goto(
        `${base}/admin/buildlog/settings`,
        { waitUntil: "domcontentloaded" },
      );
      assert.equal(
        settingsResponse?.status(),
        200,
        "Retired Buildlog settings did not redirect to the list",
      );
      await settings.getByRole("heading", { name: "Buildlog", exact: true }).waitFor();
      assert.equal(new URL(settings.url()).pathname, "/admin/buildlog");
      if (await settings.getByRole("link", { name: "Page settings" }).count()) failures.push("retired-settings-link-still-present");
      await checkWidths(settings, "retired-settings-redirect");
      const wall = await context.newPage();
      await wall.goto(`${base}/admin/community-wall/settings`, { waitUntil: "domcontentloaded" });
      await wall.getByRole("heading", { name: "Community Wall", exact: true }).waitFor();
      if (new URL(wall.url()).pathname !== "/admin/community-wall") failures.push("community-settings-not-retired");
      if (await wall.getByRole("link", { name: "Page settings" }).count()) failures.push("community-settings-link-still-present");
      stage = "history-open";
      const historyPage = await context.newPage();
      await historyPage.goto(`${base}/admin/buildlog`, { waitUntil: "domcontentloaded" });
      await historyPage.getByRole("link", { name: "New project" }).click();
      await historyPage.getByRole("heading", { name: "Create Buildlog project" }).waitFor();
      await historyPage.getByRole("textbox", { name: "Project name" }).fill("Review history guard");
      stage = "history-back";
      await historyPage.evaluate(() => window.history.back()).catch(() => {});
      await historyPage.waitForTimeout(600);
      const historyDiscard = historyPage.getByRole("dialog", { name: "Discard unsaved Buildlog changes?" });
      if (!(await historyDiscard.count())) failures.push(`history-back-unprotected-${new URL(historyPage.url()).pathname}`);
      else {
        stage = "history-cancel";
        await historyDiscard.getByRole("button", { name: "Cancel" }).click();
        await historyDiscard.waitFor({ state: "hidden" });
        assert.equal(new URL(historyPage.url()).pathname, "/admin/buildlog/new", "Browser Back discarded unsaved project edits");
        await historyPage.evaluate(() => window.history.back()).catch(() => {});
        await historyDiscard.waitFor({ timeout: 10000 });
        await historyDiscard.getByRole("button", { name: "Discard changes" }).click();
        await historyPage.getByRole("heading", { name: "Buildlog", exact: true }).waitFor({ timeout: 10000 });
        assert.equal(new URL(historyPage.url()).pathname, "/admin/buildlog", "Confirmed Back did not leave the form");
      }

      assert.equal(pageErrors, 0, "Browser page errors");
      assert.equal(blockedWrites, 0, "Unexpected browser writes were blocked");
      assert.equal(
        attemptedWrites - mockedWrites - blockedWrites,
        0,
        "Live browser writes",
      );
      assert.deepEqual(
        failures,
        [],
        "Buildlog responsive/control checks failed",
      );
    } catch {
      failures.push(`exception-${stage}`);
      // Playwright errors can include rendered project names or URLs; only report safe metrics.
      throw new Error(
        "Admin Buildlog connected review failed; see safe metrics",
      );
    } finally {
      try {
        if (context) await context.close();
      } finally {
        try {
          await browser.close();
        } finally {
          if (client) {
            try {
              const { error } = await client.auth.signOut({ scope: "local" });
              revoked = !error;
            } catch {
              // Do not revoke unrelated sessions.
            }
          }
          cookies.clear();
        }
      }
      console.log(
        JSON.stringify({
          editReviewed,
          pageErrors,
          attemptedWrites,
          mockedWrites,
          blockedWrites,
          liveWrites: attemptedWrites - mockedWrites - blockedWrites,
          failures,
          sessionRevoked: revoked,
        }),
      );
      if (client && !revoked)
        throw new Error("Review session could not be locally revoked");
    }
  },
);
