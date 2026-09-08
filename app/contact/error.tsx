"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { siteMetadata } from "@/app/data/siteMetadata";

export default function ContactError({ error, reset }: { error: Error; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Contact route error", error);
    headingRef.current?.focus();
  }, [error]);

  return (
    <div role="alert" aria-live="assertive" className="relative mt-14 px-2 pb-24 sm:px-4">
      <BlogStatePanel
        kicker="Contact unavailable"
        title={<>The form could not <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">be loaded.</span></>}
        description="This is a temporary issue. Try again, or contact Haris directly by email."
        headingLevel="h1"
        headingRef={headingRef}
        headingTabIndex={-1}
      >
        <button type="button" onClick={reset} className="rounded-full border border-text-primary bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
          Try again
        </button>
        <Link href={siteMetadata.email} className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">
          Email Haris
        </Link>
      </BlogStatePanel>
    </div>
  );
}
