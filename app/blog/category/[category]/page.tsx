import {
  extractUniqueBlogCategories,
  fetchAndSortBlogPosts,
  formatDate,
} from "app/lib/utils";
import readingDuration from "reading-duration";
import { NewsletterSignUp } from "@/app/components/NewsletterSignUp";
import { CategorySelect } from "@/app/components/CategorySelect";
import { BlogCard } from "@/app/components/BlogCard";

export const revalidate = 3600;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const allPublishedBlogPosts = await fetchAndSortBlogPosts();
  const categories = Array.from(
    extractUniqueBlogCategories(allPublishedBlogPosts),
  );

  const category = (await params).category
    ? (await params).category.toLowerCase()
    : "";

  const categoryPosts = allPublishedBlogPosts.filter((post) => {
    return (
      Array.isArray(post.categories) &&
      post.categories.some(
        (cat) => typeof cat === "string" && cat.toLowerCase() === category,
      )
    );
  });

  return (
    <div className="mt-14 w-full space-y-16 md:mt-16">
      <title>{`${category} Articles`}</title>

      {/* Header */}
      <div className="px-2 sm:px-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-text-tertiary">
          From the desk
        </p>
        <h1 className="mt-3 font-display text-5xl text-text-primary md:text-6xl">
          Articles about{" "}
          <span className="text-gradient-accent font-display italic">
            {category || "everything"}
          </span>
        </h1>
      </div>

      <div className="space-y-12 px-2 sm:px-4">
        <CategorySelect categories={categories} currentCategory={category} />

        {categoryPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categoryPosts.map((post, i) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                summary={post.summary}
                readingTime={readingDuration(post.content || "", {
                  wordsPerMinute: 200,
                  emoji: false,
                })}
                formattedDate={formatDate(post.publishedAt)}
                imageName={post.imageName}
                index={i}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">Nothing to see here yet...</p>
        )}
      </div>

      <NewsletterSignUp
        title={`Stay updated on ${category} articles`}
        description={`Sign up to receive notifications about new blog posts, insights, and exclusive content directly in your inbox.`}
        buttonText="Get Notified"
      />
    </div>
  );
}
