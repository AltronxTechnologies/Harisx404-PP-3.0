import React from "react";
import Image from "next/image";
import { getBlogImageSrc } from "./blogImage";

export function BlogArticleImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null;

  let imageSrc = getBlogImageSrc(src);
  if (imageSrc?.startsWith("https:")) {
    const url = new URL(imageSrc);
    if (url.port || url.username || url.password) imageSrc = null;
  }
  let image: React.ReactNode;

  if (imageSrc) {
    image = (
      <Image src={imageSrc} alt={alt ?? ""} width={800} height={450} className="drama-shadow rounded-xl w-full h-auto" />
    );
  } else {
    let url: URL;
    try {
      url = new URL(src);
    } catch {
      return null;
    }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;

    image = (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="my-6 flex min-h-24 w-full items-center justify-center rounded-xl border border-border-primary bg-neutral-50 px-6 text-center text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary dark:bg-white/[0.03] dark:hover:border-white/25"
      >
        {alt ? `${alt} · View source ↗` : "View image source ↗"}
      </a>
    );
  }

  // Markdown images normally sit inside a paragraph; spans keep titled captions valid there.
  return title ? (
    <span className="block">
      {image}
      <span className="mt-2 block text-center text-sm text-text-secondary">{title}</span>
    </span>
  ) : image;
}
