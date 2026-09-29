import { getArticleReactions } from "../db/actions";
import ArticleReactions from "./ArticleReactions";

export default async function ArticleReactionWrapper({
  slug,
}: {
  slug: string;
}) {
  const initialReactions = await getArticleReactions(slug).catch((error) => {
    console.error("Unable to load optional article reactions.", error);
    return null;
  });

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
    />
  );
}
