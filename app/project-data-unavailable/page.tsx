import type { Metadata } from "next";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";

export const metadata: Metadata = {
  title: "Projects Unavailable",
  robots: { index: false, follow: false },
};

export default function ProjectDataUnavailable() {
  return (
    <div className="relative mt-14 px-2 pb-24 sm:px-4">
      <BlogStatePanel
        kicker="Projects unavailable"
        title="This project cannot be loaded right now."
        description="A temporary data issue is preventing this project from loading. Please try again shortly."
        headingLevel="h1"
      >
        <Link href="/projects" className="rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
          Browse projects
        </Link>
      </BlogStatePanel>
    </div>
  );
}
