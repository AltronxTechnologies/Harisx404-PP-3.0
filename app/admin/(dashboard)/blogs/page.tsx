import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit } from "lucide-react";
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
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, updated_at")
    .order(params.sort, { ascending: params.direction === "asc", nullsFirst: false })
    .order("id", { ascending: true });

  if (params.q) query = query.ilike("title", `%${params.q.replace(/[\\%_]/g, "\\$&")}%`);
  if (params.status === "draft" || params.status === "archived") {
    query = query.eq("status", params.status);
  } else if (params.status === "scheduled") {
    query = query.eq("status", "published").gt("published_at", nowIso);
  } else if (params.status === "live") {
    query = query.eq("status", "published").lte("published_at", nowIso);
  }

  const start = (params.page - 1) * PAGE_SIZE;
  const { data: blogs, error } = await query.range(start, start + PAGE_SIZE);
  const posts = blogs?.slice(0, PAGE_SIZE) ?? [];
  const hasNext = (blogs?.length ?? 0) > PAGE_SIZE && params.page < 1000;
  const filtered = Boolean(params.q || params.status !== "all");

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

      {rawParams.saved === "1" && (
        <p role="status" className="rounded-xl border border-border-hairline bg-surface-raised p-4 text-sm text-ink-primary">
          Post saved successfully.
        </p>
      )}

      <form action="/admin/blogs" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border-hairline bg-surface-raised p-4 text-sm shadow-sm">
        <div className="min-w-48 flex-1">
          <label htmlFor="blog-search" className="mb-1 block font-medium text-ink-primary">Search titles</label>
          <input id="blog-search" name="q" type="search" defaultValue={params.q} maxLength={100} placeholder="Search post titles" className="min-h-11 w-full rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-ink-primary" />
        </div>
        <div>
          <label htmlFor="blog-status" className="mb-1 block font-medium text-ink-primary">Status</label>
          <select id="blog-status" name="status" defaultValue={params.status} className="min-h-11 rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-ink-primary">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="blog-sort" className="mb-1 block font-medium text-ink-primary">Sort by</label>
          <select id="blog-sort" name="sort" defaultValue={params.sort} className="min-h-11 rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-ink-primary">
            <option value="created_at">Created date</option>
            <option value="updated_at">Updated date</option>
            <option value="published_at">Publication date</option>
            <option value="title">Title</option>
          </select>
        </div>
        <div>
          <label htmlFor="blog-direction" className="mb-1 block font-medium text-ink-primary">Direction</label>
          <select id="blog-direction" name="direction" defaultValue={params.direction} className="min-h-11 rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-ink-primary">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <button type="submit" className="min-h-11 rounded-lg bg-accent-signal px-4 py-2 font-medium text-white hover:bg-accent-signal/90">Apply</button>
        <Link href="/admin/blogs" className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-ink-secondary underline hover:text-ink-primary">Clear</Link>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Blog posts could not be loaded. Please try again later or clear the filters.
        </div>
      )}
      {!error && <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
        <p className="border-b border-border-hairline px-6 py-3 text-sm text-ink-secondary">
          Page {params.page}: Showing {posts.length} {posts.length === 1 ? "post" : "posts"}{hasNext ? " (more available)" : ""}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
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
                    {params.page > 1 ? "No posts on this page. Go to the previous page." : filtered ? "No posts match these filters. Try another search or clear the filters." : "No blog posts yet. Create one to get started!"}
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          label === "Live"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : label === "Archived"
                              ? "bg-surface-base text-ink-secondary"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
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
        {(params.page > 1 || hasNext) && (
          <nav aria-label="Blog post pages" className="flex items-center justify-between border-t border-border-hairline px-6 py-4 text-sm">
            {params.page > 1 ? <Link href={blogListUrl(params, params.page - 1)} className="text-accent-signal underline">Previous page</Link> : <span />}
            {hasNext && <Link href={blogListUrl(params, params.page + 1)} className="text-accent-signal underline">Next page</Link>}
          </nav>
        )}
      </div>}
    </div>
  );
}
