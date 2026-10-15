import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import * as articleModule from "./blog-article-artwork.ts";

const articleImages = articleModule.articleImages || articleModule.default?.articleImages;

const apply = process.argv.includes("--apply");
const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
if (apply) required.push("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const legacyAgentImages = [
  "![h](https://res.cloudinary.com/i22q5puf/image/upload/v1792000121/portfolio/blog/c1000000-0000-0000-0000-000000000001/n5llzec1gneqawlpspxh.webp)",
  "![j](https://res.cloudinary.com/i22q5puf/image/upload/v1792000125/portfolio/blog/c1000000-0000-0000-0000-000000000001/uesnrbe5wu7opbui9bfb.webp)",
];

function check(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function verifyRemote(url, bytes) {
  if (!url?.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`)) {
    throw new Error(`Unexpected Cloudinary URL: ${url}`);
  }
  const response = await fetch(url, { headers: { Accept: "image/webp" } });
  if (!response.ok || digest(Buffer.from(await response.arrayBuffer())) !== digest(bytes)) {
    throw new Error(`Remote original differs from local WebP: ${url}`);
  }
}

async function managedImage(post, filename, media, preferredIds) {
  const bytes = await readFile(new URL(`../public/blog/article-images/${filename}`, import.meta.url));
  const folder = `portfolio/blog/${post.id}`;
  const matching = media.filter((item) => item.folder === folder &&
    (item.original_filename === filename || item.original_filename === filename.replace(/\.webp$/, " (2).webp")))
    .sort((a, b) => Number(preferredIds.includes(b.id)) - Number(preferredIds.includes(a.id)));
  for (const item of matching) {
    if (item.format !== "webp" || item.bytes !== bytes.length) throw new Error(`${filename}: existing library asset differs from local original`);
    await verifyRemote(item.secure_url, bytes);
    return item;
  }
  const publicId = `${folder}/${filename.slice(0, -5)}`;
  let resource;
  try {
    resource = await cloudinary.api.resource(publicId, { resource_type: "image" });
  } catch (error) {
    if (error?.error?.http_code !== 404 && error?.http_code !== 404) {
      throw new Error(`Cloudinary lookup failed for ${filename}: ${error?.error?.message || "unknown error"}`);
    }
  }
  if (!resource) {
    resource = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, public_id: filename.slice(0, -5),
        unique_filename: false, overwrite: false, resource_type: "image" }, (error, result) => error ? reject(error) : resolve(result));
      stream.end(bytes);
    });
  }
  if (resource.public_id !== publicId || resource.format !== "webp" || resource.bytes !== bytes.length) {
    throw new Error(`${filename}: unexpected Cloudinary upload metadata; inspect before retrying`);
  }
  await verifyRemote(resource.secure_url, bytes);
  const { data, error } = await db.from("media").insert({
    public_id: resource.public_id, url: resource.secure_url, secure_url: resource.secure_url,
    width: resource.width, height: resource.height, format: resource.format, bytes: resource.bytes,
    alt_text: filename, original_filename: filename, folder,
  }).select().single();
  check(error, `${filename}: library insert (remote asset retained for retry)`);
  media.push(data);
  return data;
}

function migratedContent(post, art, diagramUrl) {
  let body = post.content;
  if (post.slug === "securing-ai-agents") {
    for (const legacy of legacyAgentImages) body = body.replace(legacy, "\n\n");
  }
  if (body.includes(diagramUrl)) return body;
  if (/!\[[^\]]*\]\([^)]+\)|<Image\b|<img\b/i.test(body)) {
    throw new Error(`${post.slug}: unexpected inline image; review placement before migration`);
  }
  const headings = Array.from(body.matchAll(/^##[ \t]+(.+?)\s*$/gm));
  const matches = headings.filter((match) => match[1]?.trim() === art.section);
  if (matches.length !== 1 || !headings[headings.indexOf(matches[0]) + 1]) {
    throw new Error(`${post.slug}: target section has changed; review placement before migration`);
  }
  const next = headings[headings.indexOf(matches[0]) + 1];
  return `${body.slice(0, next.index).trimEnd()}\n\n![${art.alt}](${diagramUrl} "${art.caption}")\n\n${body.slice(next.index)}`;
}

async function main() {
  const slugs = Object.keys(articleImages);
  const { data: posts, error: postsError } = await db.from("blog_posts")
    .select("id, slug, title, summary, content, status, updated_at, cover_image_id, cover_image_url, canonical_url, published_at, reading_time_minutes, related_blog_post_ids, blog_post_tags(tags(name,slug))")
    .in("slug", slugs);
  check(postsError, "Blog inventory");
  if (posts.length !== slugs.length || posts.some((post) => post.status !== "published" || !post.updated_at)) {
    throw new Error("Expected exactly ten published posts with update timestamps");
  }
  const ids = posts.map((post) => post.id);
  const { data: media, error: mediaError } = await db.from("media")
    .select("id, public_id, folder, original_filename, secure_url, url, format, bytes, width, height")
    .in("folder", ids.map((id) => `portfolio/blog/${id}`));
  check(mediaError, "Media inventory");
  const { data: attachments, error: attachError } = await db.from("blog_post_media")
    .select("blog_post_id, media_id, display_order").in("blog_post_id", ids).order("display_order");
  check(attachError, "Attachment inventory");

  for (const slug of slugs) {
    const post = posts.find((item) => item.slug === slug);
    const art = articleImages[slug];
    const existing = attachments.filter((item) => item.blog_post_id === post.id).map((item) => item.media_id);
    const inBody = [...post.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<Image\b|<img\b/g)].length;
    console.log(`${slug}: ${post.id} cover=${post.cover_image_id || "none"} url=${post.cover_image_url || "none"} inline=${inBody} attached=${existing.length} scoped_media=${media.filter((item) => item.folder === `portfolio/blog/${post.id}`).length}`);
    const oldCover = !post.cover_image_url || post.cover_image_url === "/blog/production-placeholder.jpg" ||
      post.cover_image_url.includes("images.unsplash.com/photo-1550751827-4bd374c3f58b") ||
      (slug === "securing-ai-agents" && post.cover_image_url.includes("/n5llzec1gneqawlpspxh.webp"));
    const coverFile = art.cover;
    const candidate = media.find((item) => item.id === post.cover_image_id && item.folder === `portfolio/blog/${post.id}` &&
      [coverFile, coverFile.replace(/\.webp$/, " (2).webp")].includes(item.original_filename));
    if (!oldCover && post.cover_image_url !== candidate?.secure_url) {
      throw new Error(`${slug}: custom cover is present; do not overwrite it`);
    }
    const managedDiagram = media.find((item) => existing.includes(item.id) &&
      [art.illustration, art.illustration.replace(/\.webp$/, " (2).webp")].includes(item.original_filename));
    const alreadyMigrated = Boolean(candidate && managedDiagram && post.content.includes(managedDiagram.secure_url) &&
      JSON.stringify(existing) === JSON.stringify([candidate.id, managedDiagram.id]));
    if (!alreadyMigrated) migratedContent(post, art, "https://example.invalid/diagram.webp");
    if (!alreadyMigrated && slug !== "securing-ai-agents" && existing.length) throw new Error(`${slug}: unexpected prior attachments`);
    if (!alreadyMigrated && slug === "securing-ai-agents" && (existing.length !== 2 || inBody !== 2)) {
      throw new Error(`${slug}: legacy attachment or inline layout changed`);
    }
    if (!apply) continue;
    if (alreadyMigrated) {
      for (const item of [candidate, managedDiagram]) {
        const response = await fetch(item.secure_url, { headers: { Accept: "image/webp" } });
        if (!response.ok || Buffer.from(await response.arrayBuffer()).length !== item.bytes) {
          throw new Error(`${slug}: managed Cloudinary original is unavailable or has changed`);
        }
      }
      console.log(`${slug}: already migrated`);
      continue;
    }
    const cover = await managedImage(post, coverFile, media, [post.cover_image_id, ...existing]);
    const diagram = await managedImage(post, art.illustration, media, existing);
    const content = migratedContent(post, art, diagram.secure_url);
    const imageIds = [cover.id, diagram.id];
    if (imageIds.length > 20) throw new Error(`${slug}: attachment limit exceeded`);
    const { data: result, error } = await db.rpc("save_blog_post_with_tags", {
      p_id: post.id, p_expected_updated_at: post.updated_at,
      p_tags: (post.blog_post_tags || []).map((join) => join.tags).filter(Boolean),
      p_post: {
        title: post.title, slug, summary: post.summary, content, status: post.status,
        cover_image_url: cover.secure_url, cover_image_id: cover.id, image_ids: imageIds,
        canonical_url: post.canonical_url, published_at: post.published_at,
        reading_time_minutes: post.reading_time_minutes, related_blog_post_ids: post.related_blog_post_ids || [],
      },
    });
    check(error, `${slug}: guarded Blog save`);
    if (result?.post?.id !== post.id) throw new Error(`${slug}: save returned unexpected post`);
    const [{ data: saved, error: savedError }, { data: linked, error: linkedError }] = await Promise.all([
      db.from("blog_posts").select("cover_image_id, cover_image_url, content").eq("id", post.id).single(),
      db.from("blog_post_media").select("media_id").eq("blog_post_id", post.id).order("display_order"),
    ]);
    check(savedError, `${slug}: saved post verification`);
    check(linkedError, `${slug}: attachment verification`);
    if (saved.cover_image_id !== cover.id || saved.cover_image_url !== cover.secure_url || saved.content !== content ||
      JSON.stringify(linked.map((item) => item.media_id)) !== JSON.stringify(imageIds)) {
      throw new Error(`${slug}: post verification failed; retain local images`);
    }
    console.log(`${slug}: verified managed cover, diagram, and ordered attachments`);
  }
  console.log(apply ? "Migration verified; all ten posts have managed covers and diagrams." : "Dry run only; no uploads or writes performed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed; inspect Cloudinary and the media library before retrying");
  process.exitCode = 1;
});
