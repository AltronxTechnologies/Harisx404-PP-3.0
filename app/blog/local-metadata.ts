import fs from "fs";
import path from "path";
import matter from "gray-matter";

type LocalMetadata = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  categories: string[];
  draft: boolean;
  imageName: string;
};

let localMetadataCache: Map<string, LocalMetadata> | null = null;

export function getLocalMetadata() {
  if (localMetadataCache) return localMetadataCache;

  const directory = path.join(process.cwd(), "content", "blog");
  localMetadataCache = new Map();
  if (!fs.existsSync(directory)) return localMetadataCache;

  for (const file of fs.readdirSync(directory)) {
    if (!file.endsWith(".mdx")) continue;
    const { data, content } = matter(fs.readFileSync(path.join(directory, file), "utf8"));
    const slug = (typeof data.slug === "string" && data.slug.trim())
      ? data.slug.trim()
      : file.replace(/^\d+-/, "").slice(0, -4);
    localMetadataCache.set(slug, {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      summary: typeof data.summary === "string" ? data.summary : (typeof data.description === "string" ? data.description : ""),
      content,
      publishedAt:
        typeof data.publishedAt === "string"
          ? data.publishedAt
          : (typeof data.date === "string" ? data.date : new Date(0).toISOString()),
      categories: Array.isArray(data.categories)
        ? data.categories.filter((value): value is string => typeof value === "string")
        : (Array.isArray(data.tags) ? data.tags.filter((value): value is string => typeof value === "string") : []),
      draft: data.draft === true,
      imageName: typeof data.imageName === "string" ? data.imageName : (typeof data.coverImage === "string" ? data.coverImage : ""),
    });
  }

  return localMetadataCache;
}

export function isLocalBlogDraft(slug: string) {
  return getLocalMetadata().get(slug)?.draft === true;
}
