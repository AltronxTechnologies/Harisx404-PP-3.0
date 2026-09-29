import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

test("connected Blog workflow uses rich mode, durable redirects and guarded deletion", {
  skip: process.env.BLOG_LIVE_QA !== "1",
}, async () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.ok(base && key, "Connected Supabase and service-role environment are required");
  const site = process.env.BLOG_BASE_URL || "http://localhost:3000";
  const marker = randomUUID();
  let postId;
  const slugs = [0, 1, 2].map((index) => `alloy-workflow-qa-${marker}-${index}`);
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };
  const content = "## QA Heading\n\nA [safe link](/blog).\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n";
  const post = {
    slug: slugs[0], title: "Alloy Workflow QA Temporary", summary: "Temporary Blog workflow check",
    content, status: "draft", published_at: null, canonical_url: null,
    cover_image_url: null, cover_image_id: null, reading_time_minutes: 1,
  };

  async function rest(resource, method = "GET", body) {
    const response = await fetch(`${base}/rest/v1/${resource}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`${method} ${resource.split("?")[0]} returned ${response.status}: ${data.code || data.message || "unknown"}`);
    return data;
  }

  async function save(fields, expected) {
    const result = await rest("rpc/save_blog_post_with_tags", "POST", {
      p_post: fields, p_tags: [], p_id: expected ? postId : null,
      p_expected_updated_at: expected || null,
    });
    postId ||= result.post.id;
    assert.equal(result.post.id, postId);
    return result.post;
  }

  try {
    const before = await rest(`blog_posts?select=id&slug=in.(${slugs.join(",")})`);
    assert.equal(before.length, 0, "The QA slugs must be unused");
    let saved = await save(post, null);
    assert.equal(saved.editor_mode, "rich");
    assert.equal(saved.content, content);
    saved = await save({ ...post, title: "Alloy Workflow QA Updated", editor_mode: "source" }, saved.updated_at);
    assert.equal(saved.editor_mode, "rich", "Existing rich mode cannot be forged into source mode");
    assert.equal(saved.content, content, "Metadata-only save must preserve content bytes");

    const published = { ...post, title: saved.title, status: "published", published_at: new Date(Date.now() - 60_000).toISOString() };
    saved = await save(published, saved.updated_at);
    saved = await save({ ...published, slug: slugs[1] }, saved.updated_at);
    saved = await save({ ...published, slug: slugs[2] }, saved.updated_at);
    for (const old of slugs.slice(0, 2)) {
      const response = await fetch(`${site}/blog/${old}?qa=1`, { redirect: "manual" });
      assert.equal(response.status, 308, old);
      const destination = new URL(response.headers.get("location"), site);
      assert.equal(destination.pathname, `/blog/${slugs[2]}`);
      assert.equal(destination.search, "?qa=1");
    }
    const live = await fetch(`${site}/blog/${slugs[2]}`);
    assert.equal(live.status, 200);
    assert.match(await live.text(), /Alloy Workflow QA Updated/);

    const archived = await rest("rpc/transition_blog_post", "POST", {
      p_id: postId, p_expected_updated_at: saved.updated_at, p_action: "archive",
    });
    assert.equal(archived.status, "archived");
    assert.equal((await fetch(`${site}/blog/${slugs[0]}`, { redirect: "manual" })).status, 404);
    const restored = await rest("rpc/transition_blog_post", "POST", {
      p_id: postId, p_expected_updated_at: archived.updated_at, p_action: "restore",
    });
    assert.equal(restored.status, "draft");
    const finalArchive = await rest("rpc/transition_blog_post", "POST", {
      p_id: postId, p_expected_updated_at: restored.updated_at, p_action: "archive",
    });

    const stale = await fetch(`${base}/rest/v1/rpc/delete_archived_blog_post`, {
      method: "POST", headers, body: JSON.stringify({ p_id: postId, p_expected_updated_at: archived.updated_at }),
    });
    assert.notEqual(stale.status, 200);
    assert.match((await stale.json()).message || "", /BLOG_POST_CONFLICT/);
    const deleted = await rest("rpc/delete_archived_blog_post", "POST", {
      p_id: postId, p_expected_updated_at: finalArchive.updated_at,
    });
    assert.equal(deleted.deleted_slug, slugs[2]);
    assert.deepEqual(deleted.aliases, slugs.slice(0, 2));
    for (const slug of slugs) {
      assert.equal((await fetch(`${site}/blog/${slug}`, { redirect: "manual" })).status, 410, slug);
    }
  } finally {
    const cleanupErrors = [];
    for (const [resource, method] of [
      ...(postId ? [[`blog_posts?id=eq.${postId}&select=id`, "DELETE"]] : []),
      [`article_views?slug=in.(${slugs.join(",")})&select=slug`, "DELETE"],
      [`blog_slug_history?slug=in.(${slugs.join(",")})&select=slug`, "DELETE"],
    ]) {
      try { await rest(resource, method); } catch (error) { cleanupErrors.push(error); }
    }
    if (postId) assert.equal((await rest(`blog_posts?id=eq.${postId}&select=id`)).length, 0);
    assert.equal((await rest(`blog_slug_history?slug=in.(${slugs.join(",")})&select=slug`)).length, 0);
    assert.equal(cleanupErrors.length, 0, cleanupErrors.map((error) => error.message).join("; "));
  }
});
