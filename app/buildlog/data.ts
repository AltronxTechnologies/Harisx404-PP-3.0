import "server-only";

import { unstable_cache } from "next/cache";
import { buildlogProjects as fallbackProjects } from "@/app/data/buildlog";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import type { BuildlogItem, BuildlogProject } from "./types";

const normalizeItems = (value: unknown): BuildlogItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id : `item-${index + 1}`,
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : null,
      badge: typeof item.badge === "string" ? item.badge : "update",
      done: item.done === true,
      display_order: typeof item.display_order === "number" ? item.display_order : index,
    }))
    .filter((item) => item.title)
    .sort((left, right) => left.display_order - right.display_order);
};

const staticFallback: BuildlogProject[] = fallbackProjects.map((project, projectIndex) => ({
  id: `fallback-project-${projectIndex + 1}`,
  name: project.name,
  tagline: project.tagline,
  info: project.info,
  current_version: project.currentVersion,
  github_url: project.githubUrl || null,
  live_url: project.liveUrl || null,
  project_status: project.projectStatus,
  display_order: projectIndex,
  items: project.items.map((item, itemIndex) => ({
    id: `fallback-project-${projectIndex + 1}-item-${itemIndex + 1}`,
    title: item.title,
    description: item.description || null,
    badge: item.badge,
    done: item.done,
    display_order: itemIndex,
  })),
}));

const loadBuildlogProjects = async (): Promise<BuildlogProject[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return staticFallback;

  const { data, error } = await supabase
    .from("public_buildlog_projects")
    .select("id, name, tagline, info, current_version, github_url, live_url, project_status, display_order, items")
    .order("display_order", { ascending: true });

  if (error && /relation|column|does not exist|schema cache|not find/i.test(error.message)) {
    return staticFallback;
  }
  if (error) throw new Error("Unable to load the Buildlog collection.");

  return (data || []).map((project) => ({
    id: project.id,
    name: project.name,
    tagline: project.tagline,
    info: project.info,
    current_version: project.current_version,
    github_url: project.github_url || null,
    live_url: project.live_url || null,
    project_status:
      project.project_status === "live" || project.project_status === "completed"
        ? project.project_status
        : "in_progress",
    display_order: project.display_order,
    items: normalizeItems(project.items),
  }));
};

export const fetchBuildlogProjects = unstable_cache(
  loadBuildlogProjects,
  ["buildlog-projects-v4"],
  { revalidate: 3600, tags: ["buildlog"] },
);
