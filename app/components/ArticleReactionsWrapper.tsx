import { getArticleReactions, getUserReactions } from "../db/actions";
import ArticleReactions from "./ArticleReactions";

export default async function ArticleReactionWrapper({
  slug,
}: {
  slug: string;
}) {
  const [initialReactions, initialUserReactions] = await Promise.all([
    getArticleReactions(slug).catch((error) => {
      console.error("Unable to load optional article reactions.", error);
      return null;
    }),
    getUserReactions(slug).catch((error) => {
      console.error("Unable to load optional visitor reactions.", error);
      return [];
    }),
  ]);

  if (!initialReactions) {
    return (
      <p className="my-6 text-sm text-text-secondary" role="status">
        Reactions are temporarily unavailable. The article is still ready to read.
      </p>
    );
  }

  return (
    <ArticleReactions
      slug={slug}
      initialReactions={initialReactions}
      initialUserReactions={initialUserReactions}
    />
  );
}
