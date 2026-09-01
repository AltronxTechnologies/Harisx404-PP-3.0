import Image from "next/image";
import Link from "next/link";
import { optimizeImageUrl } from "@/app/lib/image-utils";

interface RelatedPostCardProps {
  slug: string;
  title: string;
  summary: string;
  imageName?: string;
}

/** Related-post card for the blog details page — reference treatment:
 *  rounded-3xl ring card, 16/11 cover with dark overlay, image zoom on
 *  hover, "Read article" footer with a dashed-border arrow badge. */
export function RelatedPostCard({ slug, title, summary, imageName }: RelatedPostCardProps) {
  const coverSrc = imageName
    ? optimizeImageUrl(
        imageName.startsWith("http") || imageName.startsWith("/") ? imageName : `/blog/${imageName}`,
        800,
      )
    : "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex h-full flex-col rounded-3xl p-2.5 ring-1 ring-border-primary transition-colors duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
    >
      {/* Cover banner */}
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900">
        {coverSrc && (
          <Image
            src={coverSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 hidden bg-black/25 dark:block" />
      </div>

      {/* Copy */}
      <div className="flex flex-1 flex-col gap-2 px-2 pb-1.5 pt-4">
        <h3 className="line-clamp-2 text-lg font-semibold leading-[1.375] text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">{summary}</p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 text-sm text-text-secondary">
          <span>Read article</span>
          <span
            aria-hidden="true"
            className="relative flex size-[25px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5 -translate-x-1/2 opacity-0 transition-all duration-500 ease-in-out group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute size-3.5 transition-all duration-500 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-0 motion-reduce:transition-none"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
