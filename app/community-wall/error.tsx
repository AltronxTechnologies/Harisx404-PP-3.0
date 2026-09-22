"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";

export default function CommunityWallError({ error, reset }: { error: Error; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error("Community Wall route error", error);
    headingRef.current?.focus();
  }, [error]);
  return (
    <div role="alert" aria-live="assertive" className="relative mt-14 px-2 pb-24 sm:px-4">
      <BlogStatePanel kicker="Community Wall unavailable" title="The wall could not be loaded." description="This is a temporary data issue. Try again or return to the homepage." headingLevel="h1" headingRef={headingRef} headingTabIndex={-1}>
        <button type="button" onClick={reset} className="rounded-full border border-text-primary bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">Try again</button>
        <Link href="/" className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">Go home</Link>
      </BlogStatePanel>
    </div>
  );
}
