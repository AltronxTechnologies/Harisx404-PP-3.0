"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { setFeaturedBlogPost } from "./actions";

interface BlogFeaturedActionProps {
  post: {
    id: string;
    title: string;
    slug: string;
    featured: boolean;
    canFeature: boolean;
  };
}

export function BlogFeaturedAction({ post }: BlogFeaturedActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const handleToggle = (targetFeatured: boolean) => {
    if (isPending) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await setFeaturedBlogPost(post.id, targetFeatured);
        if (!result.success) {
          throw new Error(result.error);
        }
        if (result.warning) setFeedback({ text: result.warning, error: false });
        router.refresh();
      } catch (error) {
        setFeedback({ text: error instanceof Error ? error.message : "Error updating featured post", error: true });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {post.featured ? (
        <button
          type="button"
          onClick={() => handleToggle(false)}
          disabled={isPending}
          aria-label={`Unfeature ${post.title}`}
          title="Currently the featured article. Click to unfeature."
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300 shadow-sm transition-all hover:bg-amber-400/25 hover:border-amber-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-amber-400" aria-hidden="true" />
          ) : (
            <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
          )}
          <span>Featured</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleToggle(true)}
          disabled={isPending || !post.canFeature}
          aria-label={`Set ${post.title} as the only featured post`}
          title={post.canFeature ? "Set this as the only featured article across the site" : "Publish this article before featuring it"}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border-hairline bg-surface-base/80 px-3 py-1 text-xs font-medium text-ink-secondary transition-all hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-ink-secondary" aria-hidden="true" />
          ) : (
            <Star className="size-3.5 text-ink-secondary shrink-0" aria-hidden="true" />
          )}
          <span>Set as featured</span>
        </button>
      )}
      {feedback && (
        <span role={feedback.error ? "alert" : "status"} className={`text-xs ${feedback.error ? "text-red-400" : "text-ink-secondary"}`} title={feedback.text}>
          {feedback.text}
        </span>
      )}
    </div>
  );
}
