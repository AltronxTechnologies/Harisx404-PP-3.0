import type { MetadataRoute } from "next";
import { fetchProjects } from "@/app/lib/utils";
import { fetchBlogIndexPosts } from "@/app/blog/data";
import { siteMetadata } from "@/app/data/siteMetadata";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchBlogIndexPosts();
  const projects = await fetchProjects();
  
  const blogUrls = posts.map((post) => ({
    url: `${siteMetadata.siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  
  const projectUrls = projects.map((project: any) => ({
    url: `${siteMetadata.siteUrl}/projects/${project.slug}`,
    lastModified: new Date(project.created_at || new Date()),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: `${siteMetadata.siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${siteMetadata.siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteMetadata.siteUrl}/credentials`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteMetadata.siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteMetadata.siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...[
      "/buildlog",
      "/community-wall",
      "/links",
      "/stats",
      "/attribution",
      "/legal/privacy",
      "/legal/terms",
    ].map((path) => ({
      url: `${siteMetadata.siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...blogUrls,
    ...projectUrls,
  ];
}
