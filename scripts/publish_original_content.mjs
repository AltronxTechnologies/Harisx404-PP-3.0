import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Read environment variables from .env.local
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

// Helper reading time estimator
function estimateReadingMinutes(content) {
  const text = (content || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#-]/g, " ")
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, " ")
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

// Simple YAML frontmatter parser
function parseMdx(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fmRaw = match[1];
  const body = match[2].trim();
  const fm = {};

  const lines = fmRaw.split(/\r?\n/);
  let currentKey = null;
  let isMultiLine = false;
  let multiLineBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isMultiLine) {
      if (/^\s{2,}/.test(line) || line.trim() === "") {
        multiLineBuffer.push(line.replace(/^\s{2}/, ""));
        continue;
      } else {
        fm[currentKey] = multiLineBuffer.join("\n").trim();
        isMultiLine = false;
        multiLineBuffer = [];
      }
    }

    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      let val = listMatch[1].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[currentKey].push(val);
      continue;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1].trim();
      let val = kvMatch[2].trim();

      if (val === "|" || val === ">") {
        isMultiLine = true;
        multiLineBuffer = [];
        continue;
      }

      if (val === "") {
        fm[currentKey] = [];
      } else if (val.startsWith("[") && val.endsWith("]")) {
        const items = val.slice(1, -1).split(",").map(s => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
        fm[currentKey] = items;
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        } else if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (!isNaN(Number(val)) && val !== "") val = Number(val);
        fm[currentKey] = val;
      }
    }
  }

  if (isMultiLine && currentKey) {
    fm[currentKey] = multiLineBuffer.join("\n").trim();
  }

  return { frontmatter: fm, body };
}

const PLACEHOLDER_IMAGE_URL = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_MEDIA_ID = "a0000000-0000-0000-0000-000000000001";

async function main() {
  console.log("=== STEP 1: CLEARING EXISTING CONTENT ===");
  await supabase.from("article_reactions").delete().neq("id", 0);
  await supabase.from("blog_slug_history").delete().neq("slug", "");
  await supabase.from("blog_post_tags").delete().neq("tag_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("blog_post_media").delete().neq("media_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("blog_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("project_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("project_tags").delete().neq("tag_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Tables cleared.");

  console.log("\n=== STEP 2: UPSERTING PLACEHOLDER MEDIA ===");
  const { error: mediaErr } = await supabase.from("media").upsert({
    id: PLACEHOLDER_MEDIA_ID,
    public_id: "portfolio/placeholder_cyber_tech",
    url: PLACEHOLDER_IMAGE_URL,
    secure_url: PLACEHOLDER_IMAGE_URL,
    width: 1200,
    height: 800,
    format: "jpg",
    bytes: 125000,
    alt_text: "Technical engineering placeholder artwork",
    original_filename: "placeholder_cyber_tech.jpg",
    folder: "portfolio"
  }, { onConflict: "id" });
  if (mediaErr) console.error("Media upsert error:", mediaErr);
  else console.log("Placeholder media verified in database.");

  console.log("\n=== STEP 3: READING AND PARSING PROJECTS ===");
  const projDir = "d:/IT/Harisx404-PP-3.0/projects";
  const projFiles = fs.readdirSync(projDir).filter(f => f.endsWith(".mdx")).sort();
  
  const projectMap = {
    "tourmate-malakand": "b1000000-0000-0000-0000-000000000001",
    "intrushield-nids": "b1000000-0000-0000-0000-000000000002",
    "packetvision-network-sniffer": "b1000000-0000-0000-0000-000000000003",
    "harisx404-portfolio-platform": "b1000000-0000-0000-0000-000000000004",
    "mail-lens-ai-phishguard": "b1000000-0000-0000-0000-000000000005",
    "medicalink-hms": "b1000000-0000-0000-0000-000000000006",
  };

  const projectRelatedMap = {
    "b1000000-0000-0000-0000-000000000001": ["b1000000-0000-0000-0000-000000000006", "b1000000-0000-0000-0000-000000000004"],
    "b1000000-0000-0000-0000-000000000002": ["b1000000-0000-0000-0000-000000000003", "b1000000-0000-0000-0000-000000000005"],
    "b1000000-0000-0000-0000-000000000003": ["b1000000-0000-0000-0000-000000000002"],
    "b1000000-0000-0000-0000-000000000004": ["b1000000-0000-0000-0000-000000000001", "b1000000-0000-0000-0000-000000000006"],
    "b1000000-0000-0000-0000-000000000005": ["b1000000-0000-0000-0000-000000000002"],
    "b1000000-0000-0000-0000-000000000006": ["b1000000-0000-0000-0000-000000000001", "b1000000-0000-0000-0000-000000000004"],
  };

  const parsedProjects = [];
  const allProjectTags = new Set();

  for (let idx = 0; idx < projFiles.length; idx++) {
    const file = projFiles[idx];
    const raw = fs.readFileSync(path.join(projDir, file), "utf8");
    const { frontmatter, body } = parseMdx(raw);
    const slug = frontmatter.slug;
    const id = projectMap[slug];

    if (!id) {
      console.error(`Unknown project slug: ${slug}`);
      continue;
    }

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    tags.forEach(t => allProjectTags.add(t));

    const projectData = {
      id,
      slug,
      title: frontmatter.title,
      description: frontmatter.tagline || frontmatter.description || "",
      tagline: frontmatter.tagline || "",
      content: body,
      status: "published",
      featured: frontmatter.featured === true,
      project_stage: frontmatter.stage || "completed",
      display_order: idx + 1,
      start_date: frontmatter.start_date || "2025-09-01",
      end_date: frontmatter.end_date || "2026-05-15",
      category: frontmatter.category || "Full-Stack Web App",
      year: String(frontmatter.year || "2026"),
      cover_image_url: PLACEHOLDER_IMAGE_URL,
      cover_image_id: PLACEHOLDER_MEDIA_ID,
      live_url: frontmatter.live_url || null,
      github_url: frontmatter.github_url || null,
      tech_stack: Array.isArray(frontmatter.tech_stack) ? frontmatter.tech_stack : [],
      features: Array.isArray(frontmatter.features) ? frontmatter.features : [],
      case_study_sections: {
        cover_caption: frontmatter.cover_caption || "",
        cover_alt: frontmatter.cover_alt || "",
        why_built: frontmatter.why_built || "",
        key_decisions: frontmatter.key_decisions || "",
        results: frontmatter.results || "",
        lessons_learned: frontmatter.lessons_learned || ""
      },
      related_project_ids: projectRelatedMap[id] || [],
      rawTags: tags
    };

    parsedProjects.push(projectData);
  }

  console.log(`Parsed ${parsedProjects.length} projects.`);

  console.log("\n=== STEP 4: READING AND PARSING BLOGS ===");
  const blogDir = "d:/IT/Harisx404-PP-3.0/blogs";
  const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith(".mdx")).sort();

  const blogMap = {
    "securing-ai-agents": "c1000000-0000-0000-0000-000000000001",
    "post-quantum-cryptography-migration": "c1000000-0000-0000-0000-000000000002",
    "ai-security-operations-center": "c1000000-0000-0000-0000-000000000003",
    "reliable-rag": "c1000000-0000-0000-0000-000000000004",
    "small-vs-large-language-models": "c1000000-0000-0000-0000-000000000005",
    "ai-application-evaluation": "c1000000-0000-0000-0000-000000000006",
    "ai-workloads-network-architecture": "c1000000-0000-0000-0000-000000000007",
    "zero-trust-networking-cloud": "c1000000-0000-0000-0000-000000000008",
    "nextjs-16-cache-components": "c1000000-0000-0000-0000-000000000009",
    "type-safe-mern-typescript": "c1000000-0000-0000-0000-000000000010",
  };

  const blogRelatedMap = {
    "c1000000-0000-0000-0000-000000000001": ["c1000000-0000-0000-0000-000000000003", "c1000000-0000-0000-0000-000000000006", "c1000000-0000-0000-0000-000000000008"],
    "c1000000-0000-0000-0000-000000000002": ["c1000000-0000-0000-0000-000000000008", "c1000000-0000-0000-0000-000000000007"],
    "c1000000-0000-0000-0000-000000000003": ["c1000000-0000-0000-0000-000000000001", "c1000000-0000-0000-0000-000000000008"],
    "c1000000-0000-0000-0000-000000000004": ["c1000000-0000-0000-0000-000000000005", "c1000000-0000-0000-0000-000000000006", "c1000000-0000-0000-0000-000000000001"],
    "c1000000-0000-0000-0000-000000000005": ["c1000000-0000-0000-0000-000000000004", "c1000000-0000-0000-0000-000000000006", "c1000000-0000-0000-0000-000000000007"],
    "c1000000-0000-0000-0000-000000000006": ["c1000000-0000-0000-0000-000000000004", "c1000000-0000-0000-0000-000000000001", "c1000000-0000-0000-0000-000000000005"],
    "c1000000-0000-0000-0000-000000000007": ["c1000000-0000-0000-0000-000000000008", "c1000000-0000-0000-0000-000000000005"],
    "c1000000-0000-0000-0000-000000000008": ["c1000000-0000-0000-0000-000000000001", "c1000000-0000-0000-0000-000000000003", "c1000000-0000-0000-0000-000000000002"],
    "c1000000-0000-0000-0000-000000000009": ["c1000000-0000-0000-0000-000000000010", "c1000000-0000-0000-0000-000000000004"],
    "c1000000-0000-0000-0000-000000000010": ["c1000000-0000-0000-0000-000000000009", "c1000000-0000-0000-0000-000000000001"],
  };

  const parsedBlogs = [];
  const allBlogTags = new Set();

  for (let idx = 0; idx < blogFiles.length; idx++) {
    const file = blogFiles[idx];
    const raw = fs.readFileSync(path.join(blogDir, file), "utf8");
    const { frontmatter, body } = parseMdx(raw);
    const slug = frontmatter.slug;
    const id = blogMap[slug];

    if (!id) {
      console.error(`Unknown blog slug: ${slug}`);
      continue;
    }

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    tags.forEach(t => allBlogTags.add(t));

    const readingMinutes = estimateReadingMinutes(body);
    const publishDate = frontmatter.date ? `${frontmatter.date}T10:00:00.000Z` : new Date().toISOString();

    const blogData = {
      id,
      slug,
      title: frontmatter.title,
      summary: frontmatter.description || frontmatter.summary || "",
      content: body,
      status: "published",
      featured: frontmatter.featured === true,
      published_at: publishDate,
      cover_image_url: PLACEHOLDER_IMAGE_URL,
      cover_image_id: PLACEHOLDER_MEDIA_ID,
      canonical_url: `https://harisx404.vercel.app/blog/${slug}`,
      reading_time_minutes: readingMinutes,
      editor_mode: "source",
      related_blog_post_ids: blogRelatedMap[id] || [],
      rawTags: tags
    };

    parsedBlogs.push(blogData);
  }

  console.log(`Parsed ${parsedBlogs.length} blogs.`);

  console.log("\n=== STEP 5: SYNCING TAGS (BULK) ===");
  const allTags = new Set([...allProjectTags, ...allBlogTags]);
  console.log(`Total unique tags to sync: ${allTags.size}`);

  // Fetch all existing tags in one query
  const { data: existingTags, error: fetchTagsErr } = await supabase
    .from("tags")
    .select("id, name, slug");
  if (fetchTagsErr) {
    console.error("Error fetching existing tags:", fetchTagsErr);
  }

  const tagRecordMap = new Map(); // name -> id
  const existingBySlug = new Map();
  for (const t of (existingTags || [])) {
    existingBySlug.set(t.slug, t.id);
    tagRecordMap.set(t.name, t.id);
  }

  const missingTags = [];
  for (const tagName of allTags) {
    const slug = tagName
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (existingBySlug.has(slug)) {
      tagRecordMap.set(tagName, existingBySlug.get(slug));
    } else {
      missingTags.push({ name: tagName, slug });
    }
  }

  if (missingTags.length > 0) {
    console.log(`Inserting ${missingTags.length} new tags in bulk...`);
    const { data: newTags, error: insErr } = await supabase
      .from("tags")
      .insert(missingTags)
      .select("id, name, slug");
    if (insErr) {
      console.error("Error bulk inserting tags:", insErr);
    } else {
      for (const t of (newTags || [])) {
        tagRecordMap.set(t.name, t.id);
      }
    }
  }
  console.log(`Synced ${tagRecordMap.size} tags.`);

  console.log("\n=== STEP 6: INSERTING PROJECTS ===");
  const projectTagRows = [];
  for (const p of parsedProjects) {
    const { rawTags, ...projectRow } = p;
    const { error: insProjErr } = await supabase.from("projects").insert(projectRow);
    if (insProjErr) {
      console.error(`Error inserting project ${p.slug}:`, insProjErr);
    } else {
      console.log(`Inserted project: ${p.title}`);
      for (const t of rawTags) {
        const tagId = tagRecordMap.get(t);
        if (tagId) {
          projectTagRows.push({ project_id: p.id, tag_id: tagId });
        }
      }
    }
  }
  if (projectTagRows.length > 0) {
    console.log(`Bulk inserting ${projectTagRows.length} project tags...`);
    const { error: pTagErr } = await supabase.from("project_tags").insert(projectTagRows);
    if (pTagErr) console.error("Error inserting project tags:", pTagErr);
  }

  console.log("\n=== STEP 7: INSERTING BLOGS ===");
  const blogTagRows = [];
  for (const b of parsedBlogs) {
    const { rawTags, ...blogRow } = b;
    const { error: insBlogErr } = await supabase.from("blog_posts").insert(blogRow);
    if (insBlogErr) {
      console.error(`Error inserting blog ${b.slug}:`, insBlogErr);
    } else {
      console.log(`Inserted blog: ${b.title}`);
      for (const t of rawTags) {
        const tagId = tagRecordMap.get(t);
        if (tagId) {
          blogTagRows.push({ blog_post_id: b.id, tag_id: tagId });
        }
      }
    }
  }
  if (blogTagRows.length > 0) {
    console.log(`Bulk inserting ${blogTagRows.length} blog tags...`);
    const { error: bTagErr } = await supabase.from("blog_post_tags").insert(blogTagRows);
    if (bTagErr) console.error("Error inserting blog tags:", bTagErr);
  }

  console.log("\n=== STEP 8: VERIFYING COUNTS IN DATABASE ===");
  const { count: blogCount } = await supabase.from("blog_posts").select("*", { count: "exact", head: true });
  const { count: projCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
  const { count: bTagsCount } = await supabase.from("blog_post_tags").select("*", { count: "exact", head: true });
  const { count: pTagsCount } = await supabase.from("project_tags").select("*", { count: "exact", head: true });

  console.log(`blog_posts count: ${blogCount}`);
  console.log(`projects count: ${projCount}`);
  console.log(`blog_post_tags count: ${bTagsCount}`);
  console.log(`project_tags count: ${pTagsCount}`);
  console.log("\nDATABASE PUBLISH COMPLETE!");
}

main().catch(console.error);
