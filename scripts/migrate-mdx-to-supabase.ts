import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#]+?)=(.+)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const contentDir = path.join(process.cwd(), 'content', 'blog');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
  
  console.log(`Found ${files.length} MDX files to migrate.`);
  
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter
    const { data: frontmatter, content } = matter(fileContent);
    
    // Fallbacks and parsing
    const slug = file.replace(/\.mdx$/, '');
    const title = frontmatter.title || slug;
    const summary = frontmatter.summary || '';
    const publishedAt = frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString() : null;
    const coverImageUrl = frontmatter.image || null;
    
    // The previous site hardcoded author/status in Velite, let's make it published
    const status = 'published';

    console.log(`Migrating: ${slug}...`);

    const { error } = await supabase
      .from('blog_posts')
      .upsert({
        slug,
        title,
        summary,
        content,
        published_at: publishedAt,
        cover_image_url: coverImageUrl,
        status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'slug' });

    if (error) {
      console.error(`Error migrating ${slug}:`, error.message);
    } else {
      console.log(`✅ Success: ${slug}`);
    }
  }
  
  console.log("Migration complete!");
}

migrate().catch(console.error);
