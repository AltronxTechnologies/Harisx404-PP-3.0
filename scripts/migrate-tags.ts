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

async function migrateTags() {
  const contentDir = path.join(process.cwd(), 'content', 'blog');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
  
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContent);
    const slug = file.replace(/\.mdx$/, '');
    
    let categories: string[] = frontmatter.categories || [];
    if (!Array.isArray(categories)) {
      categories = [categories];
    }
    
    if (categories.length === 0) continue;

    // Get the post ID
    const { data: postData } = await supabase.from('blog_posts').select('id').eq('slug', slug).single();
    if (!postData) continue;
    
    for (const catName of categories) {
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Upsert Tag
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .upsert({ name: catName, slug: catSlug }, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id').single();
      
      if (tagData) {
        // Link to Post
        await supabase
          .from('blog_post_tags')
          .upsert({ blog_post_id: postData.id, tag_id: tagData.id });
      }
    }
    console.log(`Migrated tags for: ${slug}`);
  }
  
  console.log("Tag migration complete!");
}

migrateTags().catch(console.error);
