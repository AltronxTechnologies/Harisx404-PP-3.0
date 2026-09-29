import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

test("authenticated Admin Blog flow creates, reopens, publishes and permanently deletes a QA post", {
  skip: process.env.BLOG_LIVE_QA !== "1",
}, async () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  assert.ok(base && anon && service && email, "Connected Admin environment is required");
  const site = process.env.BLOG_BASE_URL || "http://localhost:3000";
  const marker = randomUUID();
  const title = `Alloy Admin QA ${marker}`;
  const slug = `alloy-admin-qa-${marker}`;
  const renamed = `${slug}-renamed`;
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "return=representation" };
  let postId;

  async function rest(resource, method = "GET") {
    const response = await fetch(`${base}/rest/v1/${resource}`, { method, headers });
    const rows = await response.json();
    if (!response.ok) throw new Error(`${resource.split("?")[0]} returned ${response.status}`);
    return rows;
  }

  const cookies = new Map();
  const admin = createClient(base, service, { auth: { persistSession: false } });
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError) throw new Error("Unable to establish Admin QA session");
  const client = createServerClient(base, anon, {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (updates) => updates.forEach(({ name, value }) => cookies.set(name, value)),
    },
  });
  const { data: session, error: authError } = await client.auth.verifyOtp({
    token_hash: link.properties.hashed_token, type: "magiclink",
  });
  if (authError || session.user?.email !== email) throw new Error("Admin QA identity was not verified");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: site })));
    const page = await context.newPage();
    let saveResponseStatus;
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text()); });
    page.on("response", (response) => {
      if (new URL(response.url()).pathname === "/api/admin/blogs") saveResponseStatus = response.status();
    });
    await page.goto(`${site}/admin/blogs/new`);
    await page.getByRole("heading", { name: "Create New Post" }).waitFor();
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    const editor = page.locator('[contenteditable="true"][aria-label="Blog article content"]');
    await editor.click();
    await editor.pressSequentially("The first QA paragraph.");
    assert.equal(await page.getByRole("textbox", { name: "Slug" }).inputValue(), slug);
    await page.getByRole("button", { name: "Save Draft" }).click();
    await page.waitForURL(/\/admin\/blogs\?saved=1/, { timeout: 10_000 }).catch(async () => {
      const errors = await page.locator('main [role="alert"], main p.text-xs.text-red-500').allTextContents();
      const state = await page.locator("main form").evaluate((form) => ({
        valid: form.checkValidity(),
        content: form.querySelector('[contenteditable="true"]')?.textContent?.length,
        submitDisabled: form.querySelector('button[type="submit"]')?.disabled,
      }));
      throw new Error(`Draft save did not navigate; API ${saveResponseStatus || "not called"}; errors: ${errors.join(" | ") || "none"}; form: ${JSON.stringify(state)}; browser: ${pageErrors.join(" | ") || "none"}`);
    });

    const initial = await rest(`blog_posts?select=id,slug,editor_mode,content,status,updated_at&slug=eq.${slug}`);
    assert.equal(initial.length, 1);
    postId = initial[0].id;
    assert.equal(initial[0].editor_mode, "rich");
    assert.equal(initial[0].status, "draft");
    const originalContent = initial[0].content;

    await page.goto(`${site}/admin/blogs/${postId}`);
    await page.getByRole("button", { name: "Heading 3" }).waitFor();
    await page.setViewportSize({ width: 320, height: 640 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Rich edit form overflows on a small phone");
    await page.getByRole("textbox", { name: "Summary" }).fill("An edited QA summary.");
    await page.getByRole("button", { name: "Save Post" }).click();
    await page.waitForURL(/\/admin\/blogs\?saved=1/);
    const unchanged = await rest(`blog_posts?select=content,editor_mode,summary&slug=eq.${slug}`);
    assert.equal(unchanged[0].content, originalContent, "Metadata-only edit changed article bytes");
    assert.equal(unchanged[0].editor_mode, "rich");

    await page.goto(`${site}/admin/blogs/${postId}`);
    const reopenedEditor = page.locator('[contenteditable="true"][aria-label="Blog article content"]');
    await reopenedEditor.click();
    await reopenedEditor.press("ControlOrMeta+A");
    await reopenedEditor.pressSequentially("The revised QA paragraph.");
    await page.getByRole("button", { name: "Save Post" }).click();
    await page.waitForURL(/\/admin\/blogs\?saved=1/);
    const edited = await rest(`blog_posts?select=content&slug=eq.${slug}`);
    assert.match(edited[0].content, /revised QA paragraph/);

    await page.goto(`${site}/admin/blogs/${postId}`);
    await page.getByRole("combobox", { name: "Status" }).selectOption("published");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Publish Post" }).click();
    await page.waitForURL(/\/admin\/blogs\?saved=1/);
    assert.equal((await fetch(`${site}/blog/${slug}`)).status, 200);

    await page.goto(`${site}/admin/blogs/${postId}`);
    await page.getByRole("textbox", { name: "Slug" }).fill(renamed);
    await page.getByRole("button", { name: "Save Post" }).click();
    await page.waitForURL(/\/admin\/blogs\?saved=1/);
    const old = await fetch(`${site}/blog/${slug}`, { redirect: "manual" });
    assert.equal(old.status, 308);
    assert.equal(new URL(old.headers.get("location"), site).pathname, `/blog/${renamed}`);

    await page.goto(`${site}/admin/blogs?q=${encodeURIComponent(title)}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Archived list overflows on a small phone");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Archive ${title}` }).click();
    await page.getByRole("button", { name: `Permanently delete ${title}` }).waitFor();
    await page.getByRole("button", { name: `Restore ${title}` }).click();
    await page.getByRole("button", { name: `Archive ${title}` }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Archive ${title}` }).click();
    const remove = page.getByRole("button", { name: `Permanently delete ${title}` });
    await remove.waitFor();
    page.once("dialog", (dialog) => dialog.accept("wrong-slug"));
    await remove.click();
    await page.getByText("Deletion cancelled. The slug did not match.").waitFor();
    page.once("dialog", (dialog) => dialog.accept(renamed));
    await remove.click();
    await page.getByText("No posts match these filters.").waitFor();
    assert.equal((await fetch(`${site}/blog/${slug}`, { redirect: "manual" })).status, 410);
    assert.equal((await rest(`blog_posts?select=id&id=eq.${postId}`)).length, 0);
  } finally {
    await browser.close();
    const failures = [];
    if (!postId) {
      try {
        const created = await rest(`blog_posts?select=id&slug=eq.${slug}`);
        postId = created[0]?.id;
      } catch (error) { failures.push(error); }
    }
    for (const resource of [
      ...(postId ? [`blog_posts?id=eq.${postId}&select=id`] : []),
      `article_views?slug=in.(${slug},${renamed})&select=slug`,
      `blog_slug_history?slug=in.(${slug},${renamed})&select=slug`,
    ]) {
      try { await rest(resource, "DELETE"); } catch (error) { failures.push(error); }
    }
    assert.equal((await rest(`blog_posts?select=id&slug=in.(${slug},${renamed})`)).length, 0);
    assert.equal((await rest(`blog_slug_history?select=slug&slug=in.(${slug},${renamed})`)).length, 0);
    assert.equal(failures.length, 0, failures.map((error) => error.message).join("; "));
  }
});
