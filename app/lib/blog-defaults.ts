export function normalizeBlogSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function blogCanonicalUrl(slug: string, siteUrl: string) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? new URL(`/blog/${normalized}`, siteUrl).href : "";
}

export function toLocalBlogDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function todayUtcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isValidBlogDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && todayUtcDate(date) === value;
}

export function resolveBlogPublishDate({ date, edited, status, previous, previousStatus, now = new Date() }: {
  date: string;
  edited: boolean;
  status: "draft" | "published";
  previous?: string | null;
  previousStatus?: "draft" | "published";
  now?: Date;
}) {
  if (edited && date && !isValidBlogDate(date)) throw new Error("Invalid publish date");
  if (status === "draft") {
    if (!edited) return previous || "";
    return date ? `${date}T00:00:00.000Z` : "";
  }
  if (edited && date && date !== todayUtcDate(now)) return `${date}T00:00:00.000Z`;
  if (!edited && previousStatus === "published" && previous) return previous;
  if (!edited && previous && Date.parse(previous) > now.getTime()) return previous;
  return now.toISOString();
}

export function serializeBlogPublishDate(value?: string, previous?: string) {
  if (!value) return "";
  return previous && value === toLocalBlogDateTime(previous) ? previous : new Date(value).toISOString();
}

export function defaultBlogSummary(content: string, title: string) {
  const prose = content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(?:#|<|import\s|export\s|!\[|---)/.test(block));
  const text = (prose || title)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, "").trim()}...` : text;
}
