"use client";

import { startTransition, useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { BrandGlyph } from "@/app/components/BrandGlyph";
import { SketchCheckbox } from "@/app/components/buildlog/SketchCheckbox";
import type { BuildlogItem, BuildlogProject } from "./types";
import { getLatestShippedVersion, sortShippedNewest } from "./version";

const projectStatus = {
  in_progress: { label: "In progress", dot: "bg-blue-500" },
  live: { label: "Live", dot: "bg-emerald-500" },
  completed: { label: "Completed", dot: "bg-text-secondary" },
} as const;

function ReleaseRow({ item }: { item: BuildlogItem }) {
  return (
    <li className="group/item relative h-[104px] border-b border-border-primary last:border-b-0 min-[430px]:h-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-neutral-900/[0.025] opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 dark:bg-white/[0.025] motion-reduce:transition-none"
      />
      <div className="relative flex h-full items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <SketchCheckbox checked={item.done} />
        <div data-release-content className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`line-clamp-2 text-base font-medium leading-[22px] tracking-[-0.01em] ${
                item.done ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              <span className="sr-only">{item.done ? "Shipped" : "Planned"}: </span>
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13px] leading-[1.6] text-text-secondary">
                {item.description}
              </p>
            )}
          </div>
          <span className="inline-flex h-5 w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border-primary px-2.5 font-mono text-[9px] uppercase leading-none tracking-wider text-text-secondary sm:h-6 sm:px-3 sm:text-[10px]">
            {item.badge}
          </span>
        </div>
      </div>
    </li>
  );
}

function ReleaseList({ items, label }: { items: BuildlogItem[]; label: string }) {
  const scrollable = items.length > 3;
  return (
    <ol
      aria-label={label}
      tabIndex={scrollable ? 0 : undefined}
      className={
        scrollable
          ? "max-h-[312px] overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text-primary min-[430px]:max-h-72 [scrollbar-color:var(--border-primary)_transparent] [scrollbar-width:thin]"
          : undefined
      }
    >
      {items.map((item) => (
        <ReleaseRow key={item.id} item={item} />
      ))}
    </ol>
  );
}

export function BuildlogCollection({
  projects,
  initialOpen,
}: {
  projects: BuildlogProject[];
  initialOpen: string | null;
}) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(initialOpen);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setExpandedProjectId(params.get("open"));
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const updateUrl = (open: string | null) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("filter");
    if (open) params.set("open", open);
    else params.delete("open");
    const query = params.toString();
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  };

  const toggleShipped = (projectId: string) => {
    const next = expandedProjectId === projectId ? null : projectId;
    startTransition(() => {
      setExpandedProjectId(next);
      updateUrl(next);
    });
  };

  return (
    <div className="border-b border-border-primary">
          {projects.map((project, projectIndex) => {
            const plannedItems = project.items.filter((item) => !item.done);
            const shippedItems = sortShippedNewest(
              project.items.filter((item) => item.done),
            );
            const expanded = expandedProjectId === project.id;
            const visibleShipped = expanded ? shippedItems : [];
            const shippedRegionId = `buildlog-shipped-${project.id}`;
            const hasBothProjectLinks = Boolean(project.github_url && project.live_url);
            const lifecycle = projectStatus[project.project_status];
            const latestVersion = getLatestShippedVersion(
              shippedItems,
              project.current_version,
            );

            return (
              <article
                key={project.id}
                data-project-boundary
                className="relative grid min-w-0 grid-cols-1 before:absolute before:-left-2 before:-right-2 before:top-0 before:h-[1.5px] before:bg-neutral-400/60 before:content-[''] dark:before:bg-white/20 sm:before:-left-4 sm:before:-right-4 lg:grid-cols-12"
              >
                <header className="border-b border-border-primary lg:sticky lg:top-28 lg:col-span-4 lg:self-start lg:border-b-0 xl:col-span-3">
                  <div
                    data-project-status-row
                    className="flex min-h-12 items-center justify-between gap-3 border-b border-border-primary px-4 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:px-6"
                  >
                    <span>{String(projectIndex + 1).padStart(2, "0")}</span>
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className={`size-1.5 rounded-full ${lifecycle.dot}`} />
                      {lifecycle.label}
                    </span>
                  </div>
                  <div className="p-4 lg:p-6">
                    <h3 className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium leading-tight text-text-primary md:text-[30px]">
                      {project.name}
                    </h3>
                    <p className="mt-1 [font-family:var(--font-instrument-serif),serif] text-xl font-medium leading-tight text-text-secondary md:text-2xl">
                      {project.tagline}
                    </p>
                    <p className="mt-4 max-w-[34ch] text-sm leading-6 text-text-secondary">
                      {project.info}
                    </p>
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
                            aria-label={`View ${project.name} source code on GitHub (opens in a new tab)`}
                            className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border-primary px-2.5 font-mono text-[9px] uppercase tracking-wide text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25 min-[360px]:text-[10px] ${hasBothProjectLinks ? "" : "col-span-2"}`}
                          >
                            <BrandGlyph name="github" className="size-3.5" /> GitHub
                          </a>
                        )}
                        {project.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open live ${project.name} project (opens in a new tab)`}
                            className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border-primary px-2.5 font-mono text-[9px] uppercase tracking-wide text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25 min-[360px]:text-[10px] ${hasBothProjectLinks ? "" : "col-span-2"}`}
                          >
                            <ExternalLink aria-hidden="true" className="size-3.5" /> Live project
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </header>

                <div className="min-w-0 lg:col-span-8 lg:border-l lg:border-border-primary xl:col-span-9">
                  {shippedItems.length > 0 && (
                    <button
                      data-release-top-row
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={shippedRegionId}
                      onClick={() => toggleShipped(project.id)}
                      className="group flex min-h-12 w-full items-center justify-between gap-4 border-b border-border-primary px-4 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary transition-colors hover:bg-neutral-900/[0.025] hover:text-text-primary active:bg-neutral-900/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text-primary dark:hover:bg-white/[0.025] dark:active:bg-white/[0.05] sm:px-6"
                    >
                      <span
                        data-shipped-label-group
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <span className="whitespace-nowrap">
                          {expanded
                            ? "Hide shipped updates"
                            : "Show shipped updates"}
                          <span className="ml-1.5 text-text-secondary">
                            · {String(shippedItems.length).padStart(2, "0")}
                          </span>
                        </span>
                        <span data-project-version className="inline-flex h-[18px] items-center justify-center rounded-full border border-border-primary px-2 font-mono text-[8.5px] leading-none tracking-wider text-text-secondary sm:h-5 sm:px-2.5 sm:text-[9px]">
                          {latestVersion}
                        </span>
                      </span>
                      <ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  )}

                  {shippedItems.length > 0 && (
                    <div id={shippedRegionId}>
                      {visibleShipped.length > 0 && (
                        <section aria-label="Shipped updates">
                          <ReleaseList items={visibleShipped} label="Shipped updates" />
                        </section>
                      )}
                    </div>
                  )}

                  {plannedItems.length > 0 && (
                    <section aria-labelledby={`${shippedRegionId}-planned`}>
                      <h4
                        id={`${shippedRegionId}-planned`}
                        data-release-top-row={shippedItems.length === 0 ? "true" : undefined}
                        className="flex min-h-12 items-center justify-between gap-3 border-b border-border-primary px-4 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:px-6"
                      >
                        <span>Planned next · {String(plannedItems.length).padStart(2, "0")}</span>
                        {shippedItems.length === 0 && (
                          <span data-project-version className="inline-flex h-[18px] items-center justify-center rounded-full border border-border-primary px-2 font-mono text-[8.5px] leading-none tracking-wider text-text-secondary sm:h-5 sm:px-2.5 sm:text-[9px]">
                            {project.current_version}
                          </span>
                        )}
                      </h4>
                      <ReleaseList items={plannedItems} label="Planned updates" />
                    </section>
                  )}
                </div>
              </article>
            );
          })}
    </div>
  );
}
