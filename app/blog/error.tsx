"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Blog route error", error);
  }, [error]);

  return (
    <div className="relative mt-14 px-2 pb-24 sm:px-4">
      <BlogStatePanel
        kicker="Blog unavailable"
        title="The articles could not be loaded."
        description="This is a temporary data issue. Try again, or return when the collection is available."
        headingLevel="h1"
      >
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-text-primary bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
          >
            Go home
          </Link>
      </BlogStatePanel>
    </div>
  );
}
