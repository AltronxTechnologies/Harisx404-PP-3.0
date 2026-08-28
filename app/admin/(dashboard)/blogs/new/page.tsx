import { BlogForm } from "@/app/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Post</h1>
        <p className="text-sm text-ink-secondary">Write and publish a new blog post.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <BlogForm />
      </div>
    </div>
  );
}
