import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

test("single featured post enforcement in database", {
  skip: process.env.RUN_CONNECTED_BLOG_FEATURED_DESTRUCTIVE !== "1",
}, async () => {
  if (process.env.ISOLATED_RESTORE_TESTED_TARGET !== "yes") {
    throw new Error("Use only a restore-tested disposable database for this destructive test.");
  }
  const url = process.env.BLOG_FEATURED_TEST_SUPABASE_URL;
  const key = process.env.BLOG_FEATURED_TEST_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure disposable Blog test credentials separately from the application.");
  const supabase = createClient(url, key);
  const { data: posts } = await supabase.from("blog_posts").select("id, slug").limit(2);
  assert.ok(posts && posts.length >= 2, "Expected at least 2 posts for testing");

  const post1 = posts[0];
  const post2 = posts[1];

  // 1. Feature post 1
  await supabase.from("blog_posts").update({ featured: false }).neq("id", post1.id);
  await supabase.from("blog_posts").update({ featured: true }).eq("id", post1.id);

  const { data: state1 } = await supabase.from("blog_posts").select("id, featured").eq("featured", true);
  assert.equal(state1.length, 1, "Exactly one post should be featured");
  assert.equal(state1[0].id, post1.id, "Post 1 should be featured");

  // 2. Feature post 2
  await supabase.from("blog_posts").update({ featured: false }).neq("id", post2.id);
  await supabase.from("blog_posts").update({ featured: true }).eq("id", post2.id);

  const { data: state2 } = await supabase.from("blog_posts").select("id, featured").eq("featured", true);
  assert.equal(state2.length, 1, "Exactly one post should be featured after switching");
  assert.equal(state2[0].id, post2.id, "Post 2 should now be featured");

  // 3. Reset back to Securing AI Agents (slug: securing-ai-agents)
  await supabase.from("blog_posts").update({ featured: false }).neq("slug", "securing-ai-agents");
  await supabase.from("blog_posts").update({ featured: true }).eq("slug", "securing-ai-agents");

  const { data: stateFinal } = await supabase.from("blog_posts").select("slug, featured").eq("featured", true);
  assert.equal(stateFinal.length, 1, "Exactly one post should remain featured");
  assert.equal(stateFinal[0].slug, "securing-ai-agents", "securing-ai-agents should be featured");
});
