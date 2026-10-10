import type { MetadataRoute } from "next";
import { fetchProjects } from "@/app/lib/utils";
import { fetchBlogIndexPosts } from "@/app/blog/data";
import { siteMetadata } from "@/app/data/siteMetadata";
import { isOwnBlogCanonical } from "@/app/lib/blog-canonical";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([fetchBlogIndexPosts(), fetchProjects()]);
  
  const blogUrls = posts.filter((post) => isOwnBlogCanonical(post.slug, post.canonicalUrl, siteMetadata.siteUrl)).map((post) => ({
    url: `${siteMetadata.siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  
  const projectUrls = projects.map((project: any) => ({
    url: `${siteMetadata.siteUrl}/projects/${project.slug}`,
    lastModified: project.updated_at || project.created_at ? new Date(project.updated_at || project.created_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: `${siteMetadata.siteUrl}`,
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${siteMetadata.siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteMetadata.siteUrl}/credentials`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteMetadata.siteUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteMetadata.siteUrl}/projects`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...[
      "/buildlog",
      "/community-wall",
      "/contact",
      "/links",
      "/legal/privacy",
      "/legal/terms",
      "/resume",
    ].map((path) => ({
      url: `${siteMetadata.siteUrl}${path}`,
        changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...blogUrls,
    ...projectUrls,
  ];
}
