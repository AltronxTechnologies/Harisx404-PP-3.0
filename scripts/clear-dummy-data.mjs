import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envRaw = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE env variables");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function clearData() {
  console.log("Starting deletion of dummy blog and project data...");

  // 1. article_reactions
  const { error: errReactions } = await supabase
    .from("article_reactions")
    .delete()
    .neq("id", 0);
  if (errReactions) console.error("Error clearing article_reactions:", errReactions);
  else console.log("Cleared article_reactions");

  // 2. blog_slug_history
  const { error: errSlugHistory } = await supabase
    .from("blog_slug_history")
    .delete()
    .neq("slug", "");
  if (errSlugHistory) console.error("Error clearing blog_slug_history:", errSlugHistory);
  else console.log("Cleared blog_slug_history");

  // 3. blog_post_tags
  const { error: errBlogTags } = await supabase
    .from("blog_post_tags")
    .delete()
    .neq("tag_id", "00000000-0000-0000-0000-000000000000");
  if (errBlogTags) console.error("Error clearing blog_post_tags:", errBlogTags);
  else console.log("Cleared blog_post_tags");

  // 4. blog_post_media
  const { error: errBlogMedia } = await supabase
    .from("blog_post_media")
    .delete()
    .neq("media_id", "00000000-0000-0000-0000-000000000000");
  if (errBlogMedia) console.error("Error clearing blog_post_media:", errBlogMedia);
  else console.log("Cleared blog_post_media");

  // 5. blog_posts
  const { error: errBlogs } = await supabase
    .from("blog_posts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (errBlogs) console.error("Error clearing blog_posts:", errBlogs);
  else console.log("Cleared blog_posts");

  // 6. project_images
  const { error: errProjImages } = await supabase
    .from("project_images")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (errProjImages) console.error("Error clearing project_images:", errProjImages);
  else console.log("Cleared project_images");

  // 7. project_tags
  const { error: errProjTags } = await supabase
    .from("project_tags")
    .delete()
    .neq("tag_id", "00000000-0000-0000-0000-000000000000");
  if (errProjTags) console.error("Error clearing project_tags:", errProjTags);
  else console.log("Cleared project_tags");

  // 8. projects
  const { error: errProjects } = await supabase
    .from("projects")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (errProjects) console.error("Error clearing projects:", errProjects);
  else console.log("Cleared projects");

  console.log("\n--- VERIFYING TABLE ROW COUNTS ---");
  const checkTables = [
    "blog_posts",
    "projects",
    "blog_post_tags",
    "project_tags",
    "project_images",
    "article_reactions",
    "blog_slug_history",
  ];
  for (const t of checkTables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: count = ${count} ${error ? `(Error: ${error.message})` : ""}`);
  }
}

clearData();
