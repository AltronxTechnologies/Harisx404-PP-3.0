export type BuildlogItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string;
  done: boolean;
  display_order: number;
};

export type BuildlogProject = {
  id: string;
  name: string;
  tagline: string;
  info: string;
  current_version: string;
  display_order: number;
  items: BuildlogItem[];
};

export type BuildlogProjectAdmin = BuildlogProject & {
  status: "draft" | "published" | "archived";
  is_demo: boolean;
};
