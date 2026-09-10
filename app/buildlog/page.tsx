import type { Metadata } from "next";
import Link from "next/link";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { CtaSection } from "@/app/components/home/CtaSection";
import { fetchBuildlogProjects } from "./data";
import { BuildlogCollection } from "./BuildlogCollection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Buildlog | What I Ship",
  description:
    "A project-by-project record of shipped features, releases, and carefully scoped next steps from Muhammad Haris.",
};

export default async function BuildlogPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; open?: string }>;
}) {
  const projects = await fetchBuildlogProjects();
  const query = await searchParams;
  const initialFilter = query.filter === "in-progress" || query.filter === "completed"
    ? query.filter
    : "all";
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
    <div className="relative mt-14 pb-24">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
              The build never stops
            </p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Build. Ship.{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                Evolve.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              A transparent record of what I shipped, what changed, and what I am
              building next across active projects.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="buildlog-collection-heading" className="mt-14 px-2 sm:px-4">
        <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2
              id="buildlog-collection-heading"
              className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
            >
              Release archive
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              Shipped work and clearly labelled plans, organized by project.
            </p>
          </div>
          {projects.length > 0 && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              {String(shippedCount).padStart(2, "0")} shipped ·{" "}
              {String(plannedCount).padStart(2, "0")} planned
            </p>
          )}
        </div>

        {projects.length > 0 ? (
          <BuildlogCollection
            projects={projects}
            initialFilter={initialFilter}
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
    </div>
  );
}
