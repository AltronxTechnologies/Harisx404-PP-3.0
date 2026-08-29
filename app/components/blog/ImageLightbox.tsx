"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface LightboxState {
  src: string;
  alt: string;
}

/** Click-to-zoom lightbox for article images. Listens for clicks on any
 *  <img> inside #blog-article (images already show cursor:zoom-in via CSS)
 *  and presents it centered on a blurred backdrop. Esc / click closes. */
export function ImageLightbox() {
  const [image, setImage] = useState<LightboxState | null>(null);
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setImage(null), 200);
  }, []);

  useEffect(() => {
    const article = document.getElementById("blog-article");
    if (!article) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      if (target.closest("a")) return; // linked images navigate instead
      const img = target as HTMLImageElement;
      event.preventDefault();
      setImage({ src: img.currentSrc || img.src, alt: img.alt || "" });
      requestAnimationFrame(() => setVisible(true));
    };

    article.addEventListener("click", onClick);
    return () => article.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!image) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [image, close]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || "Expanded image"}
      onClick={close}
      className={`fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none sm:p-10 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close image"
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        className={`max-h-full max-w-full rounded-xl object-contain shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${
          visible ? "scale-100" : "scale-95"
        }`}
      />
    </div>
  );
}
