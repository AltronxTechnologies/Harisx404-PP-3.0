export const PAGE_SIZE = 20;
const MAX_PAGE = 1000;

export type BlogListParams = {
  q: string;
  status: "all" | "draft" | "scheduled" | "live" | "archived";
  sort: "created_at" | "updated_at" | "published_at" | "title";
  direction: "asc" | "desc";
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

export function parseBlogListParams(params: RawParams): BlogListParams {
  const value = (key: string): string | undefined => {
    const entry = params[key];
    return typeof entry === "string" ? entry : undefined;
  };
  const status = value("status");
  const sort = value("sort");
  const direction = value("direction");
  const page = value("page");

  return {
    q: (value("q") ?? "").trim().slice(0, 100),
    status: status === "draft" || status === "scheduled" || status === "live" || status === "archived" ? status : "all",
    sort: sort === "updated_at" || sort === "published_at" || sort === "title" ? sort : "created_at",
    direction: direction === "asc" ? "asc" : "desc",
    page: page && /^[1-9]\d*$/.test(page) ? Math.min(Number(page), MAX_PAGE) : 1,
  };
}

export function blogListUrl(params: BlogListParams, page: number) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status !== "all") query.set("status", params.status);
  if (params.sort !== "created_at") query.set("sort", params.sort);
  if (params.direction !== "desc") query.set("direction", params.direction);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return `/admin/blogs${suffix ? `?${suffix}` : ""}`;
}

export function blogListStatus(status: string, publishedAt: string | null, now: number) {
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  if (status === "published") {
    if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) return "Not live";
    return Date.parse(publishedAt) > now ? "Scheduled" : "Live";
  }
  return "Not live";
}
