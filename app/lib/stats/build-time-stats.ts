import { fetchAndSortBlogPosts } from "@/app/lib/utils";
import type { BuildTimeStats, CategoryCount } from "./types";

export async function getBuildTimeStats(): Promise<BuildTimeStats> {
  const posts = await fetchAndSortBlogPosts();
  const publishedPosts = posts.filter((post) => !post.draft);
  const categoryMap = new Map<string, number>();
  publishedPosts.forEach((post) => {
    post.categories.forEach((category) => {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
  });
  const categoryBreakdown: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count);
  return { totalArticles: publishedPosts.length, categoryBreakdown };
}
