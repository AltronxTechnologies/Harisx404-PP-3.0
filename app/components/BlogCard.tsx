"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { optimizeImageUrl } from "@/app/lib/image-utils";

const covers = [
  "from-violet-500/30 to-indigo-900/40",
  "from-blue-500/30 to-sky-900/40",
  "from-pink-500/30 to-rose-900/40",
];

export interface BlogCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  formattedDate: string;
  imageName?: string;
  /** Index used to pick the gradient placeholder cover */
  index?: number;
}

export function BlogCard({
  slug,
  title,
  summary,
  readingTime,
  formattedDate,
  imageName,
  index = 0,
}: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: (index % 3) * 0.05 }}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
      }}
      className="h-full"
    >
      <Link
        href={`/blog/${slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-primary bg-white transition-all hover:border-text-tertiary/60 hover:shadow-lg dark:bg-white/[0.02]"
      >
        {imageName ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={optimizeImageUrl(imageName, 800)}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center bg-black/25 px-6 text-center font-display text-xl italic leading-snug text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]"
            >
              {title}
            </span>
          </div>
        ) : (
          <div className="relative aspect-[16/9] overflow-hidden">
            <div
              className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 ${covers[index % covers.length]}`}
            />
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center px-6 text-center font-display text-xl italic leading-snug text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]"
            >
              {title}
            </span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-medium leading-snug text-text-primary">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm text-text-secondary">{summary}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-mono text-[11px] text-text-secondary">
              {readingTime} · {formattedDate}
            </span>
            <span className="text-sm text-text-secondary">
              Read article{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
