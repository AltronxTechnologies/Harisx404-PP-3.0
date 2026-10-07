import { BlogForm } from "@/app/components/admin/BlogForm";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewBlogPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const db = await createSupabaseAdminClient();
  const { data: availablePosts, error } = await db.from("blog_posts").select("id, title, slug, status, published_at").order("title");
  if (error) return <div className="space-y-4"><h1 className="text-2xl font-bold tracking-tight">Create New Post</h1><p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Blog editor could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/blogs/new?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link> or return to <Link href="/admin/blogs" className="font-medium underline underline-offset-2">Blogs</Link>.</p></div>;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Post</h1>
        <p className="text-sm text-ink-secondary">Write and publish a new blog post.</p>
      </div>
      
      <div className="min-w-0 rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <BlogForm availablePosts={availablePosts ?? []} />
      </div>
    </div>
  );
}
