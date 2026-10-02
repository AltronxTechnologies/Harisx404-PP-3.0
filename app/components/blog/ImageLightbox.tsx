"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import styles from "./ImageLightbox.module.css";

interface LightboxState {
  src: string;
  alt: string;
}

/** Zoom unlinked article images without changing the article's image rendering. */
export function ImageLightbox() {
  const [image, setImage] = useState<LightboxState | null>(null);
  const [visible, setVisible] = useState(false);
  const opener = useRef<HTMLImageElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openFrame = useRef<number | null>(null);

  const close = useCallback(() => {
    if (closeTimer.current !== null) return;
    setVisible(false);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setImage(null);
      if (opener.current?.isConnected) opener.current.focus();
      opener.current = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);
  }, []);

  useEffect(() => {
    const article = document.getElementById("blog-article");
    if (!article) return;

    const triggers = Array.from(article.querySelectorAll("img")).filter((img) => !img.closest("a"));
    const originalAttributes = triggers.map((img) => ({
      img,
      role: img.getAttribute("role"),
      tabIndex: img.getAttribute("tabindex"),
      label: img.getAttribute("aria-label"),
    }));
    for (const img of triggers) {
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.setAttribute("aria-label", `Zoom image: ${img.alt || "article image"}`);
      img.classList.add(styles.trigger);
    }

    const open = (img: HTMLImageElement) => {
      opener.current = img;
      setImage({ src: img.currentSrc || img.src, alt: img.alt || "" });
      openFrame.current = requestAnimationFrame(() => {
        openFrame.current = null;
        setVisible(true);
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.closest("a")) return;
      event.preventDefault();
      open(target);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.closest("a")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open(target);
    };

    article.addEventListener("click", onClick);
    article.addEventListener("keydown", onKeyDown);
    return () => {
      article.removeEventListener("click", onClick);
      article.removeEventListener("keydown", onKeyDown);
      for (const { img, role, tabIndex, label } of originalAttributes) {
        for (const [name, value] of [["role", role], ["tabindex", tabIndex], ["aria-label", label]] as const) {
          if (value === null) img.removeAttribute(name);
          else img.setAttribute(name, value);
        }
        img.classList.remove(styles.trigger);
      }
      if (openFrame.current !== null) cancelAnimationFrame(openFrame.current);
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!image) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [image, close]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || "Expanded image"}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className={`fixed inset-0 z-[7000] flex cursor-zoom-out items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none sm:p-10 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        ref={closeButton}
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
