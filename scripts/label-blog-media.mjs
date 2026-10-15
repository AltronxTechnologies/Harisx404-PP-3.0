import { createClient } from "@supabase/supabase-js";
import * as artworkModule from "./blog-article-artwork.ts";

const artwork = artworkModule.articleImages || artworkModule.default?.articleImages;

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Connected server credentials are required");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: posts, error: postsError } = await db.from("blog_posts").select("id, slug, title")
    .in("slug", Object.keys(artwork)).eq("status", "published");
  if (postsError || posts?.length !== 10) throw new Error("Expected ten published articles");
  const { data: links, error: linksError } = await db.from("blog_post_media")
    .select("blog_post_id, media:media_id(id, folder, original_filename, alt_text)")
    .in("blog_post_id", posts.map((post) => post.id));
  if (linksError || links?.length !== 20) throw new Error("Expected twenty managed article attachments");

  const changes = [];
  for (const post of posts) {
    const images = links.filter((link) => link.blog_post_id === post.id).map((link) => link.media);
    if (images.length !== 2) throw new Error(`${post.slug}: expected two managed images`);
    for (const image of images) {
      const entry = artwork[post.slug];
      const original = image.original_filename?.replace(/ \(2\)(?=\.webp$)/, "");
      const altText = original === entry.cover ? `Cover artwork for ${post.title}`
        : original === entry.illustration ? entry.alt : null;
      if (!altText || image.folder !== `portfolio/blog/${post.id}`) throw new Error(`${post.slug}: unexpected attached image`);
      if (image.alt_text === altText) continue;
      if (image.alt_text !== image.original_filename) throw new Error(`${post.slug}: custom media description exists; review manually`);
      changes.push({ id: image.id, before: image.alt_text, altText });
    }
  }
  if (!process.argv.includes("--apply")) return console.log(`Dry run: ${changes.length} managed media labels need descriptions.`);
  for (const item of changes) {
    const { data, error } = await db.from("media").update({ alt_text: item.altText })
      .eq("id", item.id).eq("alt_text", item.before).select("id");
    if (error || data?.length !== 1) throw new Error("Media description changed concurrently; inspect before retrying");
  }
  console.log(`Updated ${changes.length} managed media descriptions.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Media labeling failed"); process.exitCode = 1; });
