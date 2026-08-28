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

  let { data } = await supabase.from('media').select('id').eq('public_id', cloudResult.public_id).single();
  if (data) return data.id;

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

async function migrateProjects() {
  const contentDir = path.join(process.cwd(), 'content', 'projects');
  if (!fs.existsSync(contentDir)) {
    console.log("No projects folder found.");
    return;
  }
  
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
  console.log(`Found ${files.length} projects to migrate.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    const slug = file.replace(/\.mdx$/, '');
    console.log(`Processing: ${slug}`);

    // Process Cover Image
    let coverImageId = null;
    let coverImageUrl = null;
    if (frontmatter.image) {
      // Assuming project images are in /public/images/projects or similar. Let's extract filename.
      const imageName = frontmatter.image.split('/').pop();
      const imagePath = path.join(process.cwd(), 'public', frontmatter.image);
      
      if (fs.existsSync(imagePath)) {
        console.log(`  Uploading cover image: ${imageName}`);
        const result = await uploadToCloudinary(imagePath, 'portfolio/projects');
        if (result) {
          coverImageId = await getOrCreateMedia(result);
          coverImageUrl = result.secure_url;
        }
      } else {
         console.warn(`  Cover image not found locally: ${imagePath}`);
      }
    }

    const payload = {
      slug,
      title: frontmatter.title,
      description: frontmatter.description || '',
      content: content,
      status: 'published',
      live_url: frontmatter.url || null,
      github_url: frontmatter.repository || null,
      cover_image_id: coverImageId,
      cover_image_url: coverImageUrl,
      display_order: i,
    };

    const { data: project, error } = await supabase
      .from('projects')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`  Failed to insert ${slug}:`, error.message);
      continue;
    }
    
    // Process Tags
    if (frontmatter.techStack) {
      for (const cat of frontmatter.techStack) {
        const tagSlug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        let tagId;
        const { data: existingTag } = await supabase.from('tags').select('id').eq('slug', tagSlug).single();
        
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error } = await supabase.from('tags').insert({
            name: cat,
            slug: tagSlug,
          }).select('id').single();
          
          if (!error) tagId = newTag.id;
        }

        if (tagId) {
          await supabase.from('project_tags').insert({
            project_id: project.id,
            tag_id: tagId
          }).select().maybeSingle();
        }
      }
    }
  }

  console.log("Projects Migration complete!");
}

migrateProjects();
