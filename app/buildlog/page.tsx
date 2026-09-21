import type { Metadata } from "next";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";
import { fetchBuildlogProjects, fetchBuildlogSettings } from "./data";
import { BuildlogCollection } from "./BuildlogCollection";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchBuildlogSettings();
  const socialImage = `${siteMetadata.siteUrl}/brand/logo-wide.png`;
  return {
    title: settings.seo_title,
    description: settings.seo_description,
    openGraph: {
      title: settings.seo_title,
      description: settings.seo_description,
      type: "website",
      url: `${siteMetadata.siteUrl}/buildlog`,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: settings.seo_title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo_title,
      description: settings.seo_description,
      images: [socialImage],
    },
  };
}

export default async function BuildlogPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const [projects, settings] = await Promise.all([
    fetchBuildlogProjects(),
    fetchBuildlogSettings(),
  ]);
  const query = await searchParams;
  const initialOpen = query.open && projects.some((project) => project.id === query.open)
    ? query.open
    : null;
  const shippedCount = projects.reduce(
    (count, project) => count + project.items.filter((item) => item.done).length,
    0,
  );
  const plannedCount = projects.reduce(
    (count, project) => count + project.items.filter((item) => !item.done).length,
    0,
  );

  return (
    <>
      <section aria-labelledby="buildlog-collection-heading" className="mt-14 px-2 sm:px-4">
        <div
          data-release-summary
          className="-mx-2 flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:-mx-4 sm:px-8"
        >
          <h2
            id="buildlog-collection-heading"
            className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
          >
            {settings.archive_label}
          </h2>
          {projects.length > 0 && (
            <div className="flex shrink-0 items-center gap-2.5 font-mono uppercase sm:gap-3">
              <p className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="tabular-nums text-[9px] tracking-widest text-text-secondary min-[360px]:text-[10px]">
                  {String(shippedCount).padStart(2, "0")}
                </span>
                <span className="text-[9px] tracking-widest text-text-secondary min-[360px]:text-[10px]">
                  shipped
                </span>
              </p>
              <span aria-hidden="true" className="h-4 w-px bg-border-primary" />
              <p className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="tabular-nums text-[9px] tracking-widest text-text-secondary min-[360px]:text-[10px]">
                  {String(plannedCount).padStart(2, "0")}
                </span>
                <span className="text-[9px] tracking-widest text-text-secondary min-[360px]:text-[10px]">
                  planned
                </span>
              </p>
            </div>
          )}
        </div>

        {projects.length > 0 ? (
          <BuildlogCollection
            projects={projects}
            initialOpen={initialOpen}
          />
        ) : (
          <BlogStatePanel
            kicker="No entries yet"
            title={
              <>
                The next release notes are being{" "}
                <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                  prepared.
                </span>
              </>
            }
            description="Published project updates will appear here as they are added through the admin panel."
          >
            <Link
              href="/projects"
              className="inline-flex min-h-9 items-center rounded-full border border-border-primary px-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
            >
              View projects
            </Link>
          </BlogStatePanel>
        )}
      </section>

      <div className="mt-28">
        <CtaSection />
      </div>
    </>
  );
}
