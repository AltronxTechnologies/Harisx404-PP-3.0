import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { BlogFilters } from "@/app/components/admin/BlogFilters";
import { BlogArchiveAction } from "./BlogArchiveAction";
import { blogListStatus, blogListUrl, PAGE_SIZE, parseBlogListParams } from "./blogList";

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const rawParams = await searchParams;
  const params = parseBlogListParams(rawParams);
  const now = new Date();
  const nowIso = now.toISOString();
  const supabase = await createSupabaseAdminClient();
  const filteredQuery = (head: boolean) => {
    let query = supabase.from("blog_posts")
      .select("id, title, slug, status, published_at, updated_at", head ? { count: "exact", head: true } : undefined);

    if (params.q) query = query.ilike("title", `%${params.q.replace(/[\\%_]/g, "\\$&")}%`);
    if (params.status === "draft" || params.status === "archived") {
      query = query.eq("status", params.status);
    } else if (params.status === "scheduled") {
      query = query.eq("status", "published").gt("published_at", nowIso);
    } else if (params.status === "live") {
      query = query.eq("status", "published").lte("published_at", nowIso);
    } else if (params.status === "not-live") {
      query = query.eq("status", "published").is("published_at", null);
    }
    return query;
  };

  const { count, error: countError } = await filteredQuery(true);
  const totalPages = count === null ? 0 : Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (!countError && count !== null && params.page > totalPages) {
    redirect(blogListUrl(params, totalPages));
  }
  const start = (params.page - 1) * PAGE_SIZE;
  const { data: blogs, error: postsError } = countError || count === null
    ? { data: null, error: countError }
    : await filteredQuery(false)
      .order(params.sort, { ascending: params.direction === "asc", nullsFirst: false })
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
  const error = countError || count === null || postsError;
  const posts = blogs ?? [];
  const filtered = Boolean(params.q || params.status !== "all");
  const successMessage = rawParams.saved === "1" ? "Post saved successfully."
    : rawParams.notice === "archived" ? "Post archived and unpublished."
    : rawParams.notice === "restored" ? "Post restored as a draft."
    : rawParams.notice === "deleted" ? "Post permanently deleted."
    : null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-ink-secondary">Manage your blog posts here.</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Link>
      </div>

      {successMessage && (
        <p role="status" className="flex items-center gap-3 rounded-2xl border border-[#315543] bg-[#18271e] px-4 py-3 text-sm text-[#a9e2bc]">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />{successMessage}
        </p>
      )}
      {rawParams.notice === "deleted" && rawParams.cleanup === "images" && <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-200">Post deleted. Some image files were retained or could not be removed safely. Review them in the Media Library.</p>}

      <BlogFilters key={blogListUrl(params, params.page)} params={params} />

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          Blog posts could not be loaded. Please try again later or clear the filters.
        </div>
      )}
      {!error && <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
        <p role="status" className="border-b border-border-hairline px-6 py-3 text-sm text-ink-secondary">
          {count === 0 ? "Showing 0 posts" : `Showing ${start + 1}-${start + posts.length} of ${count} posts`}
        </p>
         <div className="overflow-x-auto" role="region" aria-label="Blog posts table" tabIndex={0}>
           <table className="admin-action-table w-full text-sm text-left">
            <caption className="sr-only">Blog posts matching the selected search and status</caption>
            <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Title</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Publication date</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-secondary">
                    {filtered ? "No posts match these filters. Try another search or clear the filters." : "No blog posts yet. Create one to get started!"}
                  </td>
                </tr>
              ) : (
                posts.map((blog) => {
                  const label = blogListStatus(blog.status, blog.published_at, now.getTime());
                  return (
                    <tr key={blog.id} className="hover:bg-surface-base/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-ink-primary">
                        {blog.title}
                        <div className="text-xs text-ink-secondary font-normal mt-1">{blog.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`admin-status ${label === "Live" ? "admin-status--live" : label === "Archived" || label === "Not live" ? "admin-status--neutral" : "admin-status--pending"}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-secondary">
                        {blog.status === "published" && blog.published_at && Number.isFinite(Date.parse(blog.published_at)) ? new Date(blog.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not published"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {blog.status !== "archived" && (
                            <Link
                              href={`/admin/blogs/${blog.id}`}
                              aria-label={`Edit ${blog.title}`}
                              className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                          <BlogArchiveAction post={blog} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
         <nav aria-label="Blog post pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border-hairline px-6 py-3 text-sm">
           <span className="text-ink-secondary">Page <strong className="font-medium text-ink-primary">{params.page}</strong> of {totalPages}</span>
           <div className="flex items-center gap-2">
             {params.page > 1 ? (
               <Link href={blogListUrl(params, params.page - 1)} rel="prev" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-hairline px-3 text-ink-primary transition-colors hover:bg-surface-base"><ChevronLeft aria-hidden className="size-4" /> Previous</Link>
             ) : <span aria-disabled="true" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-hairline px-3 text-ink-secondary opacity-50"><ChevronLeft aria-hidden className="size-4" /> Previous</span>}
             {params.page < totalPages ? (
               <Link href={blogListUrl(params, params.page + 1)} rel="next" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-hairline px-3 text-ink-primary transition-colors hover:bg-surface-base">Next <ChevronRight aria-hidden className="size-4" /></Link>
             ) : <span aria-disabled="true" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-hairline px-3 text-ink-secondary opacity-50">Next <ChevronRight aria-hidden className="size-4" /></span>}
           </div>
         </nav>
      </div>}
    </div>
  );
}
