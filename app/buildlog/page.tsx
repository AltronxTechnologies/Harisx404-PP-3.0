import type { Metadata } from "next";
import Link from "next/link";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { SketchCheckbox } from "@/app/components/buildlog/SketchCheckbox";
import { CtaSection } from "@/app/components/home/CtaSection";
import { fetchBuildlogProjects } from "./data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Buildlog | What I Ship",
  description:
    "A project-by-project record of shipped features, releases, and carefully scoped next steps from Muhammad Haris.",
};

export default async function BuildlogPage() {
  const projects = await fetchBuildlogProjects();
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
          <div className="border-b border-border-primary">
            {projects.map((project, projectIndex) => {
              const shipped = project.items.filter((item) => item.done).length;
              return (
                <article
                  key={project.id}
                  className="grid min-w-0 grid-cols-1 border-t border-border-primary lg:grid-cols-12"
                >
                  <header className="border-b border-border-primary p-4 lg:sticky lg:top-28 lg:col-span-4 lg:self-start lg:border-b-0 lg:p-6 xl:col-span-3">
                    <p className="font-mono text-xs font-medium tracking-widest text-text-secondary">
                      {String(projectIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 [font-family:var(--font-instrument-serif),serif] text-2xl font-medium leading-tight text-text-primary md:text-[30px]">
                      {project.name}
                    </h3>
                    <p className="mt-1 [font-family:var(--font-instrument-serif),serif] text-xl font-medium leading-tight text-text-secondary md:text-2xl">
                      {project.tagline}
                    </p>
                    <p className="mt-4 max-w-[34ch] text-sm leading-6 text-text-secondary">
                      {project.info}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                      <span className="rounded-full border border-border-primary px-3 py-1.5">
                        {project.current_version}
                      </span>
                      <span>{shipped}/{project.items.length} shipped</span>
                    </div>
                  </header>

                  <ol className="min-w-0 lg:col-span-8 lg:border-l lg:border-border-primary xl:col-span-9">
                    {project.items.length > 0 ? (
                      project.items.map((item) => (
                        <li
                          key={item.id}
                          className="group/item relative border-b border-border-primary last:border-b-0 lg:last:border-b"
                        >
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-neutral-900/[0.025] opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 dark:bg-white/[0.025] motion-reduce:transition-none"
                          />
                          <div className="relative flex items-start gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                            <SketchCheckbox checked={item.done} />
                            <div className="flex min-w-0 flex-1 flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                              <div className="min-w-0">
                                <p
                                  className={`text-base font-medium leading-[22px] tracking-[-0.01em] ${
                                    item.done ? "text-text-primary" : "text-text-secondary"
                                  }`}
                                >
                                  <span className="sr-only">{item.done ? "Shipped" : "Planned"}: </span>
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.6] text-text-secondary">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <span className="w-fit shrink-0 whitespace-nowrap rounded-full border border-border-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                                {item.badge}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-6 py-10 text-sm text-text-secondary">
                        No release items have been published for this project yet.
                      </li>
                    )}
                  </ol>
                </article>
              );
            })}
          </div>
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
