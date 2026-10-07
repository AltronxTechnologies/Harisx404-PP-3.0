import { FileText, Briefcase, Image, Settings, Plus, ExternalLink, ArrowUpRight, Layers, Eye, Heart, ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { getServerStats } from "@/app/lib/stats/server-stats";
import { blogListStatus } from "./blogs/blogList";

export const metadata = {
  title: "Dashboard | Admin",
};

export default async function AdminDashboard() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const blogAdmin = await createSupabaseAdminClient();
  const now = new Date();

  // Fetch stats in parallel
  const [
    { count: blogCount, error: blogCountError },
    { count: publishedBlogCount, error: publishedBlogCountError },
    { count: draftBlogCount, error: draftBlogCountError },
    { count: projectCount, error: projectCountError },
    { data: recentPosts, error: recentPostsError },
    { data: recentProjects, error: recentProjectsError },
    serverStats,
  ] = await Promise.all([
    blogAdmin.from("blog_posts").select("id", { count: "exact", head: true }),
    blogAdmin.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published").lte("published_at", now.toISOString()),
    blogAdmin.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    blogAdmin.from("projects").select("id", { count: "exact", head: true }),
    blogAdmin.from("blog_posts").select("id, title, slug, status, published_at").order("created_at", { ascending: false }).limit(5),
    blogAdmin.from("projects").select("id, title, slug, status").order("created_at", { ascending: false }).limit(5),
    getServerStats().catch(() => null),
  ]);

  const statCards = [
    { label: "Total Blog Posts", value: blogCountError ? "—" : blogCount ?? 0, icon: FileText, href: "/admin/blogs" },
    { label: "Live Posts", value: publishedBlogCountError ? "—" : publishedBlogCount ?? 0, icon: FileText, href: "/admin/blogs" },
    { label: "Draft Posts", value: draftBlogCountError ? "—" : draftBlogCount ?? 0, icon: FileText, href: "/admin/blogs" },
    { label: "Total Projects", value: projectCountError ? "—" : projectCount ?? 0, icon: Briefcase, href: "/admin/projects" },
    { label: "Article Views", value: serverStats ? serverStats.totalViews : "—", icon: Eye, href: "/admin/analytics" },
    { label: "Reactions", value: serverStats ? serverStats.totalReactions : "—", icon: Heart, href: "/admin/analytics" },
  ];

  const quickActions = [
    { label: "New Blog Post", href: "/admin/blogs/new", icon: Plus },
    { label: "New Project", href: "/admin/projects/new", icon: Plus },
    { label: "Upload Media", href: "/admin/media", icon: Image },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
    { label: "View Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
    { label: "View Live Site", href: "/", icon: ExternalLink, external: true },
  ];

  return (
    <div data-admin-dashboard-overview className="flex flex-col gap-8" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Welcome back, Haris. Here&apos;s an overview of your portfolio.</p>
      </div>
      {(blogCountError || publishedBlogCountError || draftBlogCountError || projectCountError || !serverStats) && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">Some dashboard totals are unavailable. A dash means the value could not be confirmed; it does not mean zero. Refresh the page to retry.</p>}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-border-primary bg-white p-5 transition-colors dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                  <div className="rounded-xl border border-border-primary bg-bg-primary p-2.5 text-text-primary transition-colors">
                   <Icon className="size-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div data-admin-dashboard-actions className="rounded-2xl border border-border-primary bg-white dark:bg-white/[0.03]">
          <div className="border-b border-border-primary/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              if (action.external) {
                return (
                  <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl border border-border-primary/50 bg-bg-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-border-primary/30 hover:text-text-primary">
                    <Icon className="h-4 w-4 shrink-0" />
                    {action.label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                );
              }
              return (
                <Link key={action.label} href={action.href} className="flex min-h-11 items-center gap-3 rounded-xl border border-border-primary/50 bg-bg-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-border-primary/30 hover:text-text-primary">
                  <Icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div data-admin-dashboard-recent className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-border-primary bg-white dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-border-primary/50 px-6 py-4">
              <h2 className="font-semibold text-text-primary">Recent Blog Posts</h2>
              <Link href="/admin/blogs" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-text-primary transition-colors">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border-primary/30">
              {recentPostsError ? (
                <p role="alert" className="px-6 py-8 text-center text-sm text-text-secondary">Recent blog posts could not be loaded. Try again later.</p>
              ) : (recentPosts ?? []).length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-text-secondary">No posts yet. <Link href="/admin/blogs/new" className="text-text-primary underline">Create your first one.</Link></p>
              ) : (
                (recentPosts ?? []).map((post: any) => {
                  const status = blogListStatus(post.status, post.published_at, now.getTime());
                  return (
                    <div key={post.id} className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{post.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {post.status === "published" && post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not published"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:ml-3">
                        <span className={`admin-status ${status === "Live" ? "admin-status--live" : status === "Archived" || status === "Not live" ? "admin-status--neutral" : "admin-status--pending"}`}>
                          {status}
                        </span>
                        <Link href={post.status === "archived" ? "/admin/blogs?status=archived" : `/admin/blogs/${post.id}`} aria-label={post.status === "archived" ? "View archived posts" : `Edit ${post.title}`} className="inline-flex size-11 items-center justify-center rounded-xl text-text-primary transition-colors">
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary bg-white dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-border-primary/50 px-6 py-4">
              <h2 className="font-semibold text-text-primary">Recent Projects</h2>
              <Link href="/admin/projects" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-text-primary transition-colors">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border-primary/30">
              {recentProjectsError ? (
                <p role="alert" className="px-6 py-8 text-center text-sm text-text-secondary">Recent projects could not be loaded. Try again later.</p>
              ) : (recentProjects ?? []).length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-text-secondary">No projects yet. <Link href="/admin/projects/new" className="text-text-primary underline">Add your first project.</Link></p>
              ) : (
                (recentProjects ?? []).map((project: any) => {
                  const status = project.status === "published" ? "Published" : project.status === "draft" ? "Draft" : project.status === "archived" ? "Archived" : "Unknown";
                  return (
                    <div key={project.id} className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-primary">
                          <Layers className="h-4 w-4 text-text-primary" />
                        </div>
                        <p className="truncate text-sm font-medium text-text-primary">{project.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:ml-3">
                        <span className={`admin-status ${status === "Published" ? "admin-status--live" : status === "Draft" ? "admin-status--pending" : "admin-status--neutral"}`}>
                          {status}
                        </span>
                        <Link href={`/admin/projects/${project.id}`} aria-label={`Edit ${project.title}`} className="inline-flex size-11 items-center justify-center rounded-xl text-text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-current">
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
     </div>
  );
}
