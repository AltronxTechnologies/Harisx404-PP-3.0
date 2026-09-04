"use client";

import { useEffect } from "react";
import Link from "next/link";

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
      <div className="mx-auto max-w-2xl rounded-3xl border border-border-primary bg-white px-6 py-16 text-center dark:bg-white/[0.02]">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Blog unavailable
        </p>
        <h1 className="mt-4 font-display text-[46px] font-medium leading-none text-text-primary md:text-[56px]">
          The articles could not be loaded.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-6 text-text-secondary">
          This is a temporary data issue. Try again, or return when the
          collection is available.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
        </div>
      </div>
    </div>
  );
}
