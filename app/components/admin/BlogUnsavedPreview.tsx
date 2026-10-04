"use client";

import { useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import * as jsxRuntime from "react/jsx-runtime";
import * as jsxDevRuntime from "react/jsx-dev-runtime";
import { sharedComponents } from "@/app/components/mdx-components";
import { BlogArticleImage } from "@/app/components/blog/BlogArticleImage";
import { BlogCodeWindow, BlogInlineCode } from "@/app/components/blog/BlogCode";
import { getBlogImageSrc, isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { defaultBlogSummary } from "@/app/lib/blog-defaults";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import { ImageLightbox } from "@/app/components/blog/ImageLightbox";
import { TableOfContents } from "@/app/components/TableOfContents";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { formatReadingTime } from "@/app/lib/reading-time";
import { addHeadingIds, extractHeadingsFromMdx } from "@/app/lib/toc-utils";
import { validateBlogMdx } from "@/app/lib/blog-mdx-policy.mjs";

type Snapshot = {
  title: string;
  summary?: string;
  content: string;
  cover_image_url?: string;
  published_at?: string;
  status: "draft" | "published";
};

export function BlogUnsavedPreview({ snapshot: post, isNew }: { snapshot: Snapshot; isNew: boolean }) {
  const [rendered, setRendered] = useState<{ content: ComponentType<{ components: Record<string, ComponentType<any>> }> | null; error: string; loading: boolean }>({ content: null, error: "", loading: true });

  useEffect(() => {
    let cancelled = false;
    setRendered({ content: null, error: "", loading: true });
    (async () => {
      try {
        if (!post.title.trim() || post.title.length > 200 || !post.content.trim() || post.content.length > 1_000_000 || (post.summary?.length ?? 0) > 1000 || (post.cover_image_url && !isAllowedBlogImageUrl(post.cover_image_url) && !post.cover_image_url.startsWith("/blog/"))) {
          throw new Error("Invalid preview fields");
        }
        validateBlogMdx(post.content);
        const code = post.content.replace(
          /<iframe\b(?=[^>]*\bsrc=["']https:\/\/codepen\.io\/([^/"']+)\/embed\/(?:preview\/)?([^?"']+)[^"']*["'])[^>]*>[\s\S]*?<\/iframe>/gi,
          (_match, author: string, penId: string) => `[Open this interactive example on CodePen](https://codepen.io/${encodeURIComponent(author)}/pen/${encodeURIComponent(penId)})`,
        );
        validateBlogMdx(code);
        const { default: content } = await evaluate(code, {
          ...(process.env.NODE_ENV === "production" ? { ...jsxRuntime, development: false } : { ...jsxDevRuntime, development: true }),
          remarkPlugins: [remarkGfm, () => addHeadingIds],
        } as any);
        if (!cancelled) setRendered({ content, error: "", loading: false });
      } catch {
        if (!cancelled) setRendered({ content: null, error: "Article content cannot be safely previewed. Check its MDX formatting.", loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [post]);

  if (rendered.loading) return <p role="status" className="p-6 text-center text-sm text-ink-secondary">Rendering preview...</p>;
  if (rendered.error || !rendered.content) return <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{rendered.error}</p>;

  const Content = rendered.content;
  const publicationDate = post.published_at && Number.isFinite(Date.parse(post.published_at)) ? new Date(post.published_at) : null;
  const status = post.status === "draft" ? "Draft" : publicationDate && publicationDate.getTime() > Date.now() ? "Scheduled" : "Live when saved";
  const coverSrc = getBlogImageSrc(optimizeImageUrl(post.cover_image_url || "", 1600));
  const summary = post.summary?.trim() || (isNew ? defaultBlogSummary(post.content, post.title) : "");

  return (
    <div className="blog-detail relative min-w-0 pb-12">
      <p className="mx-auto mb-8 max-w-3xl rounded-lg border border-border-hairline bg-surface-raised px-4 py-3 text-sm text-ink-secondary">
        {status} / Unsaved preview. This is how the article body and hero may look; nothing has been published or saved.
      </p>
      {coverSrc && <div className="relative mx-auto mb-10 h-48 w-full max-w-3xl overflow-hidden rounded-xl bg-surface-raised sm:h-72">
        <Image src={coverSrc} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
      </div>}
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center" style={{ maxWidth: "680px" }}>
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-text-primary">Blog / {status}</span>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl break-words text-balance font-display text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">{post.title}</h1>
            {summary && <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary [overflow-wrap:anywhere]">{summary}</p>}
          </header>
        </div>
      </GridWrapper>
      <div className="relative mt-14 px-4 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-primary pb-4 text-sm text-text-secondary" style={{ maxWidth: "680px" }}>
          <span>{formatReadingTime(post.content)}</span>
          {publicationDate && <time dateTime={publicationDate.toISOString()}>{new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(publicationDate)}</time>}
        </div>
      </div>
      <div className="relative mb-12 mt-8 px-4 md:px-6">
        <article id="blog-article" className="blog-article-shell prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-3xl break-words [&>*:first-child]:mt-0 [&>div>*:first-child]:mt-0" style={{ maxWidth: "680px" }}>
          <Content components={{ ...sharedComponents, img: BlogArticleImage, Image: BlogArticleImage, pre: BlogCodeWindow, code: BlogInlineCode }} />
        </article>
      </div>
      <TableOfContents headings={extractHeadingsFromMdx(post.content)} />
      <ImageLightbox />
    </div>
  );
}
