import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MDXContent } from "@/app/components/mdx";
import { BlogArticleImage } from "@/app/components/blog/BlogArticleImage";
import { BlogCodeWindow, BlogInlineCode } from "@/app/components/blog/BlogCode";
import { ImageLightbox } from "@/app/components/blog/ImageLightbox";
import { TableOfContents } from "@/app/components/TableOfContents";
import { extractHeadingsFromMdx } from "@/app/lib/toc-utils";
import { formatReadingTime } from "@/app/lib/reading-time";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Saved post preview | Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SavedBlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/admin/login");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/");

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseAdminClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("id, title, summary, content, status, published_at, reading_time_minutes")
    .eq("id", id)
    .maybeSingle();

  if (error) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300">Saved preview could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/blogs/${id}/preview?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link> or return to <Link href="/admin/blogs" className="font-medium underline underline-offset-2">Blog posts</Link>.</div>;
  if (!post || post.status === "archived") notFound();

  const publicationDate = post.published_at && Number.isFinite(Date.parse(post.published_at))
    ? new Date(post.published_at)
    : null;
  const status = post.status === "draft"
    ? "Draft"
    : publicationDate && publicationDate.getTime() > Date.now()
      ? "Scheduled"
      : publicationDate ? "Live" : "Not live";
  const readingTime = Number(post.reading_time_minutes) > 0
    ? `${post.reading_time_minutes} min read`
    : formatReadingTime(post.content || "");

  return (
    <div className="min-w-0 pb-20">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 text-sm">
        <Link href={`/admin/blogs/${post.id}`} className="text-accent-signal underline hover:text-ink-primary">
          Back to editor
        </Link>
        <span className="rounded-full border border-border-hairline bg-surface-raised px-3 py-1 font-mono text-xs uppercase tracking-wide text-ink-secondary">
          {status} / Saved preview
        </span>
      </nav>
      <p className="mx-auto mt-5 max-w-3xl rounded-lg border border-border-hairline bg-surface-raised px-4 py-3 text-sm text-ink-secondary">
        Admin-only preview of the saved post. Unsaved editor changes will not appear here.
      </p>

      <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-y-5 px-4 pt-12 text-center md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">Blog / {status}</p>
        <h1 className="text-balance font-display text-3xl tracking-wide text-neutral-900 dark:text-white sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-text-secondary sm:text-lg">
            {post.summary}
          </p>
        )}
        <p className="text-sm text-text-secondary">
          {readingTime}
          {publicationDate && <> / <time dateTime={post.published_at}>{publicationDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></>}
        </p>
      </header>

      <div className="relative mt-10 px-4 md:px-6">
        <article id="blog-article" className="blog-article-shell prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-3xl overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>div>*:first-child]:mt-0" style={{ maxWidth: "680px" }}>
          <MDXContent code={post.content || ""} components={{ img: BlogArticleImage, Image: BlogArticleImage, pre: BlogCodeWindow, code: BlogInlineCode }} />
        </article>
      </div>
      <TableOfContents headings={extractHeadingsFromMdx(post.content || "")} />
      <ImageLightbox />
    </div>
  );
}
