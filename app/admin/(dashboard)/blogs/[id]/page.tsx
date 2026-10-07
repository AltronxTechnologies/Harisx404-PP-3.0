import { BlogForm } from "@/app/components/admin/BlogForm";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseAdminClient();
  const [{ data: blog, error }, { data: availablePosts, error: optionsError }] = await Promise.all([
    supabase.from("blog_posts").select("*, blog_post_tags(tags(name))").eq("id", id).maybeSingle(),
    supabase.from("blog_posts").select("id, title, slug, status, published_at").order("title"),
  ]);

  if (error || optionsError) return <div className="space-y-4"><h1 className="text-2xl font-bold tracking-tight">Edit Post</h1><p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Blog editor could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/blogs/${id}?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link> or return to <Link href="/admin/blogs" className="font-medium underline underline-offset-2">Blogs</Link>.</p></div>;
  if (!blog) notFound();
  if (blog.status === "archived") notFound();

  const tags =
    blog.blog_post_tags
      ?.map((item: any) => item.tags?.name)
      .filter((name: unknown): name is string => typeof name === "string") || [];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-sm text-ink-secondary">Update your blog post details.</p>
      </div>
      
      <div className="min-w-0 rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <BlogForm initialData={{ ...blog, content: blog.content || "", tags }} availablePosts={availablePosts ?? []} />
      </div>
    </div>
  );
}
