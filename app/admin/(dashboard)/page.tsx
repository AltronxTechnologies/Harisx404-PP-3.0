import { FileText, Briefcase, Image, Settings, Plus, ExternalLink, ArrowUpRight, Layers } from "lucide-react";
import Link from "next/link";
import createSupabaseServerClient from "@/app/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Admin",
};

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Fetch stats in parallel
  const [
    { count: blogCount },
    { count: publishedBlogCount },
    { count: draftBlogCount },
    { count: projectCount },
    { data: recentPosts },
    { data: recentProjects },
  ] = await Promise.all([
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id, title, slug, status, publishedAt").order("created_at", { ascending: false }).limit(5),
    supabase.from("projects").select("id, title, slug, status").order("created_at", { ascending: false }).limit(5),
  ]);

  const statCards = [
    { label: "Total Blog Posts", value: blogCount ?? 0, icon: FileText, href: "/admin/blogs", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Published Posts", value: publishedBlogCount ?? 0, icon: FileText, href: "/admin/blogs", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Draft Posts", value: draftBlogCount ?? 0, icon: FileText, href: "/admin/blogs", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Total Projects", value: projectCount ?? 0, icon: Briefcase, href: "/admin/projects", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  ];

  const quickActions = [
    { label: "New Blog Post", href: "/admin/blogs/new", icon: Plus },
    { label: "New Project", href: "/admin/projects/new", icon: Plus },
    { label: "Upload Media", href: "/admin/media", icon: Image },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
    { label: "View Live Site", href: "/", icon: ExternalLink, external: true },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Welcome back, Haris. Here&apos;s an overview of your portfolio.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-border-primary/50 bg-bg-primary p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border-primary/50 bg-bg-primary shadow-sm">
          <div className="border-b border-border-primary/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              if (action.external) {
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary border border-border-primary/50 hover:bg-border-primary/30 hover:text-text-primary transition-all"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {action.label}
                  </a>
                );
              }
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary border border-border-primary/50 hover:bg-border-primary/30 hover:text-text-primary transition-all"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Blog Posts */}
        <div className="rounded-xl border border-border-primary/50 bg-bg-primary shadow-sm">
          <div className="flex items-center justify-between border-b border-border-primary/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Recent Blog Posts</h2>
            <Link href="/admin/blogs" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border-primary/30">
            {(recentPosts ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-text-secondary">No posts yet. <Link href="/admin/blogs/new" className="text-indigo-600 hover:underline">Create your first one.</Link></p>
            ) : (
              (recentPosts ?? []).map((post: any) => (
                <div key={post.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{post.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not published"}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                      {post.status}
                    </span>
                    <Link href={`/admin/blogs/${post.id}`} className="text-indigo-600 hover:text-indigo-700">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-xl border border-border-primary/50 bg-bg-primary shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border-primary/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Recent Projects</h2>
            <Link href="/admin/projects" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border-primary/30">
            {(recentProjects ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-text-secondary">No projects yet. <Link href="/admin/projects/new" className="text-indigo-600 hover:underline">Add your first project.</Link></p>
            ) : (
              (recentProjects ?? []).map((project: any) => (
                <div key={project.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                      <Layers className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-text-primary">{project.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${project.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                      {project.status}
                    </span>
                    <Link href={`/admin/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-700">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
