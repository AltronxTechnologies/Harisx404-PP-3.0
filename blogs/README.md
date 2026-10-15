# Blog Editorial Sources

The live Blog uses published `blog_posts` rows and their managed Cloudinary media, not these MDX files. The `blogs/` and `content/blog/` copies are editorial archives; their historical cover frontmatter is not a publishing source and must not be imported over the live articles. Edit published content in Admin Blog so cover associations, ordered images, tags, and concurrent-edit checks stay intact.

For reviewed changes made directly to published rows, `scripts/review-blog-editorial.mjs` records guarded, repeatable corrections. The retired bulk importer was removed because it derived slugs from duplicate filenames and could recreate posts without their managed media.
