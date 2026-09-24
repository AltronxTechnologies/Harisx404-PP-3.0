"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { RESUME_PDF } from "@/app/data/resume";

export default function ResumeError({ error, reset }: { error: Error; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Resume route error", error);
    headingRef.current?.focus();
  }, [error]);

  return (
    <div role="alert" aria-live="assertive" className="relative mt-14 px-2 pb-24 sm:px-4">
      <BlogStatePanel
        kicker="Resume unavailable"
        title={<>The web resume could not <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">be loaded.</span></>}
        description="Try the page again, or open the PDF directly while the web version recovers."
        headingLevel="h1"
        headingRef={headingRef}
        headingTabIndex={-1}
      >
        <button type="button" onClick={reset} className="rounded-full border border-text-primary bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
          Try again
        </button>
        <a href={RESUME_PDF} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
          Open PDF<span className="sr-only"> in a new tab</span>
        </a>
        <Link href="/" className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
          Go home
        </Link>
      </BlogStatePanel>
    </div>
  );
}
