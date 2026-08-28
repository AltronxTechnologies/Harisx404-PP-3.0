import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing environment variables. Make sure you run with node --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

async function uploadToCloudinary(localPath, folderName) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: folderName,
      use_filename: true,
      unique_filename: false,
    });
    return result;
  } catch (err) {
    console.error(`Failed to upload ${localPath}:`, err.message);
    return null;
  }
}

async function getOrCreateMedia(cloudResult) {
  if (!cloudResult) return null;

  // Check if it already exists
  let { data } = await supabase.from('media').select('id').eq('public_id', cloudResult.public_id).single();
  if (data) return data.id;

  // Insert
  const { data: newMedia, error } = await supabase.from('media').insert({
    public_id: cloudResult.public_id,
    url: cloudResult.url,
    secure_url: cloudResult.secure_url,
    width: cloudResult.width,
    height: cloudResult.height,
    format: cloudResult.format,
    bytes: cloudResult.bytes,
    folder: cloudResult.folder,
  }).select('id').single();

  if (error) {
    console.error("Failed to insert media:", error);
    return null;
  }
  return newMedia.id;
}

async function processTags(categories, blogId) {
  if (!categories || categories.length === 0) return;

  for (const cat of categories) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Upsert Tag
    let tagId;
    const { data: existingTag } = await supabase.from('tags').select('id').eq('slug', slug).single();
    
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error } = await supabase.from('tags').insert({
        name: cat,
        slug: slug,
      }).select('id').single();
      
      if (error) {
        console.error("Tag insert error:", error);
        continue;
      }
      tagId = newTag.id;
    }

    // Link tag to blog
    await supabase.from('blog_tags').insert({
      blog_post_id: blogId,
      tag_id: tagId
    }).select().maybeSingle(); // ignore uniqueness errors gracefully
  }
}

async function migrateBlogs() {
  const contentDir = path.join(process.cwd(), 'content', 'blog');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

  console.log(`Found ${files.length} blog posts to migrate.`);

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    const slug = file.replace(/\.mdx$/, '');
    console.log(`Processing: ${slug}`);

    // Process Cover Image
    let coverImageId = null;
    let coverImageUrl = null;
    if (frontmatter.imageName) {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'blog', frontmatter.imageName);
      if (fs.existsSync(imagePath)) {
        console.log(`  Uploading cover image: ${frontmatter.imageName}`);
        const result = await uploadToCloudinary(imagePath, 'portfolio/blog');
        if (result) {
          coverImageId = await getOrCreateMedia(result);
          coverImageUrl = result.secure_url;
        }
      }
    }

    // Prepare Content (replace local images with Cloudinary in the future, skipping deep regex for now as most are text)
    // Basic insert
    const payload = {
      slug,
      title: frontmatter.title,
      summary: frontmatter.summary || '',
      content: content,
      published_at: frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString() : null,
      status: 'published', // existing content is published
      cover_image_id: coverImageId,
      cover_image_url: coverImageUrl,
    };

    // Upsert blog post
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`  Failed to insert ${slug}:`, error.message);
      continue;
    }

    // Process Tags
    if (frontmatter.categories) {
      await processTags(frontmatter.categories, blogPost.id);
    }
  }

  console.log("Migration complete!");
}

migrateBlogs();
