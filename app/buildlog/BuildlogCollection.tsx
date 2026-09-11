"use client";

import { startTransition, useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { BrandGlyph } from "@/app/components/BrandGlyph";
import { SketchCheckbox } from "@/app/components/buildlog/SketchCheckbox";
import type { BuildlogItem, BuildlogProject } from "./types";

type ProjectFilter = "all" | "in-progress" | "completed";

const filters: { value: ProjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const isFilter = (value: string | null): value is ProjectFilter =>
  value === "all" || value === "in-progress" || value === "completed";

function ReleaseRow({ item }: { item: BuildlogItem }) {
  return (
    <li className="group/item relative border-b border-border-primary last:border-b-0">
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
  );
}

export function BuildlogCollection({
  projects,
  initialFilter,
  initialOpen,
}: {
  projects: BuildlogProject[];
  initialFilter: ProjectFilter;
  initialOpen: string | null;
}) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>(initialFilter);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(initialOpen);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const filter = params.get("filter");
      setActiveFilter(isFilter(filter) ? filter : "all");
      setExpandedProjectId(params.get("open"));
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const updateUrl = (filter: ProjectFilter, open: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (filter === "all") params.delete("filter");
    else params.set("filter", filter);
    if (open) params.set("open", open);
    else params.delete("open");
    const query = params.toString();
    window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const chooseFilter = (filter: ProjectFilter) => {
    startTransition(() => {
      setActiveFilter(filter);
      setExpandedProjectId(null);
      updateUrl(filter, null);
    });
  };

  const toggleShipped = (projectId: string) => {
    const next = expandedProjectId === projectId ? null : projectId;
    startTransition(() => {
      setExpandedProjectId(next);
      updateUrl(activeFilter, next);
    });
  };

  const projectMatches = (project: BuildlogProject, filter: ProjectFilter) => {
    const hasPlanned = project.items.some((item) => !item.done);
    if (filter === "in-progress") return hasPlanned;
    if (filter === "completed") return !hasPlanned;
    return true;
  };
  const visibleProjects = projects.filter((project) => projectMatches(project, activeFilter));

  return (
    <>
      <div className="mb-6 overflow-x-auto border-b border-border-primary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div aria-label="Filter Buildlog projects" className="flex min-w-max items-center gap-2 pb-3">
          {filters.map((filter) => {
            const count = projects.filter((project) => projectMatches(project, filter.value)).length;
            const selected = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseFilter(filter.value)}
                className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 font-mono text-[10px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
                  selected
                    ? "border-text-primary bg-text-primary text-bg-primary"
                    : "border-border-primary text-text-secondary hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 dark:hover:border-white/25 dark:active:border-white/25"
                }`}
              >
                {filter.label}
                <span aria-hidden="true" className={selected ? "text-bg-primary/70" : "text-text-secondary"}>
                  {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleProjects.length > 0 ? (
        <div className="border-b border-border-primary">
          {visibleProjects.map((project) => {
            const projectIndex = projects.findIndex((candidate) => candidate.id === project.id);
            const plannedItems = project.items.filter((item) => !item.done);
            const shippedItems = project.items.filter((item) => item.done);
            const expanded = expandedProjectId === project.id;
            const shippedPreview = plannedItems.length === 0 && !expanded ? shippedItems.slice(0, 2) : [];
            const visibleShipped = expanded ? shippedItems : shippedPreview;
            const hiddenShippedCount = shippedItems.length - visibleShipped.length;
            const shippedRegionId = `buildlog-shipped-${project.id}`;
            const hasBothProjectLinks = Boolean(project.github_url && project.live_url);

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
                    <span>{shippedItems.length}/{project.items.length} shipped</span>
                  </div>
                  {(project.github_url || project.live_url) && (
                    <div
                      data-project-links
                      className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2"
                    >
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${project.name} source code on GitHub`}
                          className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-full border border-border-primary px-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25 ${hasBothProjectLinks ? "" : "col-span-2"}`}
                        >
                          <BrandGlyph name="github" className="size-3.5" /> GitHub
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open live ${project.name} project`}
                          className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-full border border-border-primary px-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25 ${hasBothProjectLinks ? "" : "col-span-2"}`}
                        >
                          <ExternalLink aria-hidden="true" className="size-3.5" /> Live project
                        </a>
                      )}
                    </div>
                  )}
                </header>

                <div className="min-w-0 lg:col-span-8 lg:border-l lg:border-border-primary xl:col-span-9">
                  {plannedItems.length > 0 && (
                    <section aria-labelledby={`${shippedRegionId}-planned`}>
                      <h4 id={`${shippedRegionId}-planned`} className="border-b border-border-primary px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:px-6">
                        Planned next · {String(plannedItems.length).padStart(2, "0")}
                      </h4>
                      <ol>{plannedItems.map((item) => <ReleaseRow key={item.id} item={item} />)}</ol>
                    </section>
                  )}

                  {shippedItems.length > 0 && (hiddenShippedCount > 0 || expanded) && (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={shippedRegionId}
                      onClick={() => toggleShipped(project.id)}
                      className="group flex min-h-12 w-full items-center justify-between gap-4 border-t border-border-primary px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary transition-colors hover:bg-neutral-900/[0.025] hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text-primary dark:hover:bg-white/[0.025] sm:px-6"
                    >
                      <span>
                        {expanded
                          ? "Hide shipped updates"
                          : `Show ${hiddenShippedCount || shippedItems.length} shipped ${hiddenShippedCount === 1 ? "update" : "updates"}`}
                      </span>
                      <ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  )}

                  {shippedItems.length > 0 && (
                    <div id={shippedRegionId}>
                      {visibleShipped.length > 0 && (
                        <section aria-labelledby={`${shippedRegionId}-heading`}>
                          <h4 id={`${shippedRegionId}-heading`} className="border-b border-border-primary px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:px-6">
                            Shipped · {String(shippedItems.length).padStart(2, "0")}
                          </h4>
                          <ol>{visibleShipped.map((item) => <ReleaseRow key={item.id} item={item} />)}</ol>
                        </section>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border-y border-border-primary px-4 py-14 text-center sm:px-6">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
            No matching projects
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">
            No projects currently match this view. Choose another filter to continue browsing.
          </p>
          <button
            type="button"
            onClick={() => chooseFilter("all")}
            className="mt-5 min-h-9 rounded-full border border-border-primary px-5 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25"
          >
            Show all projects
          </button>
        </div>
      )}
    </>
  );
}
