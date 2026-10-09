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
    status: string;
  };
}

export function BlogFeaturedAction({ post }: BlogFeaturedActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = (targetFeatured: boolean) => {
    if (isPending) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await setFeaturedBlogPost(post.id, targetFeatured);
        if (!result.success) {
          throw new Error("Failed to update featured post");
        }
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Error updating featured post");
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
          disabled={isPending}
          aria-label={`Set ${post.title} as the only featured post`}
          title="Set this as the only featured article across the site"
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
      {errorMessage && (
        <span role="alert" className="text-xs text-red-400" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
