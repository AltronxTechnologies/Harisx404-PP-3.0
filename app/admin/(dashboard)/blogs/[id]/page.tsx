import { BlogForm } from "@/app/components/admin/BlogForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAdminClient();
  const [{ data: blog, error }, { data: availablePosts, error: optionsError }] = await Promise.all([
    supabase.from("blog_posts").select("*, blog_post_tags(tags(name))").eq("id", id).single(),
    supabase.from("blog_posts").select("id, title, slug, status, published_at").order("title"),
  ]);

  if (optionsError) throw optionsError;
  if (error || !blog) {
    notFound();
  }
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
