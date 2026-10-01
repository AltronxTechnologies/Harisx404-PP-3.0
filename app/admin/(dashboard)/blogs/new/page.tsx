import { BlogForm } from "@/app/components/admin/BlogForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export default async function NewBlogPage() {
  const db = await createSupabaseAdminClient();
  const { data: availablePosts, error } = await db.from("blog_posts").select("id, title, slug, status, published_at").order("title");
  if (error) throw error;
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
