# ?? Content Migration Guide (MDX ? Supabase)

---

## 1. Overview

Currently all 64 blog posts are stored as `.mdx` files in `content/blog/`.
They must be migrated to the `blog_posts` table in Supabase.

This migration runs ONCE. After migration, blog content lives in the database.

---

## 2. MDX Frontmatter Structure (Current)

Each MDX file starts with frontmatter like this:
```yaml
---
title: "How to Create an Animated Loading Spinner with Tailwind CSS"
publishedAt: "2021-03-15"
summary: "In this article, we explore how to create an animated loading spinner with Tailwind CSS using animations."
imageName: "loading-spinner.jpeg"
categories:
  - Tailwind CSS
  - CSS
draft: false
---
```

Fields to migrate:
| MDX Field | DB Column | Notes |
|---|---|---|
| title | title | Direct copy |
| publishedAt | published_at | Convert to TIMESTAMPTZ |
| summary | summary | Direct copy |
| imageName | cover_image_url | Prefix with /blog/ path for now |
| categories | tags (via blog_post_tags) | Create/find tags, link via join |
| draft | status | draft=true ? 'draft', draft=false ? 'published' |
| slug (filename) | slug | Filename without .mdx |
| body (MDX content) | content | The full MDX body after frontmatter |

---

## 3. Migration Script

**File:** `scripts/migrate-mdx-to-supabase.ts`

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

async function migrateBlogPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
  console.log(`Found ${files.length} MDX files`);

  for (const file of files) {
    const slug = file.replace('.mdx', '');
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Insert blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .upsert({
        slug,
        title: frontmatter.title,
        summary: frontmatter.summary,
        content,
        cover_image_url: frontmatter.imageName ? `/blog/${frontmatter.imageName}` : null,
        published_at: frontmatter.publishedAt,
        status: frontmatter.draft ? 'draft' : 'published',
        featured: false,
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`Error migrating ${slug}:`, error);
      continue;
    }

    // Handle categories/tags
    if (frontmatter.categories && Array.isArray(frontmatter.categories)) {
      for (const category of frontmatter.categories) {
        const tagSlug = category.toLowerCase().replace(/\s+/g, '-');

        // Upsert tag
        const { data: tag } = await supabase
          .from('tags')
          .upsert({ name: category, slug: tagSlug }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (tag && post) {
          // Link blog post to tag
          await supabase
            .from('blog_post_tags')
            .upsert({
              blog_post_id: post.id,
              tag_id: tag.id
            }, { onConflict: 'blog_post_id,tag_id' });
        }
      }
    }

    console.log(`Migrated: ${slug}`);
  }

  console.log('Migration complete!');
}

migrateBlogPosts().catch(console.error);
```

**Run with:**
```bash
npx tsx scripts/migrate-mdx-to-supabase.ts
```

---

## 4. Verification After Migration

```sql
-- Check total posts migrated
SELECT COUNT(*) FROM blog_posts;

-- Check published vs draft
SELECT status, COUNT(*) FROM blog_posts GROUP BY status;

-- Check tags created
SELECT COUNT(*) FROM tags;

-- Sample a migrated post
SELECT slug, title, status, published_at FROM blog_posts LIMIT 5;
```

---

## 5. Post-Migration Steps

1. Update `app/lib/utils.ts` — remove Velite imports, add Supabase queries
2. Update `app/blog/page.tsx` — fetch from Supabase instead of Velite
3. Update `app/blog/[slug]/page.tsx` — fetch from Supabase
4. Remove Velite from `package.json` and `next.config.mjs`
5. Remove `content/blog/` directory (or archive it as backup)
6. Remove `velite.config.ts`

---

## 6. Keeping Content Portable

Your blog content (MDX/Markdown) is stored in the `content` column of `blog_posts`.
To export all content:

```sql
-- Export all blog posts as JSON
SELECT json_agg(row_to_json(blog_posts)) FROM blog_posts;
```

Or download via Supabase dashboard ? Table Editor ? Export CSV.
