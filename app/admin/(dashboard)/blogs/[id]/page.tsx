import { BlogForm } from "@/app/components/admin/BlogForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data: blog, error } = await supabase
    .from("blog_posts")
    .select("*, blog_post_tags(tags(name))")
    .eq("id", id)
    .single();

  if (error || !blog) {
    notFound();
  }

  const tags =
    blog.blog_post_tags
      ?.map((item: any) => item.tags?.name)
      .filter((name: unknown): name is string => typeof name === "string") || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-sm text-ink-secondary">Update your blog post details.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <BlogForm initialData={{ ...blog, tags }} />
      </div>
    </div>
  );
}
