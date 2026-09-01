"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Link as LinkIcon } from "lucide-react";
import { BrandGlyph } from "@/app/components/BrandGlyph";

/** Copy-URL action in the article meta row — reference control: link icon +
 *  "Copy URL" + rotating chevron that opens a small share menu. */
export function CopyUrlButton() {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shareTo = (network: "x" | "linkedin") => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const target =
      network === "x"
        ? `https://twitter.com/intent/tweet?url=${url}&text=${title}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(target, "_blank", "noopener,noreferrer,width=600,height=500");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0 items-center text-blue-600 text-sm dark:text-blue-400">
      <button
        type="button"
        onClick={copy}
        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:text-blue-300"
      >
        {copied ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : <LinkIcon className="size-3.5 shrink-0" aria-hidden="true" />}
        {copied ? "Copied!" : "Copy URL"}
      </button>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="More share options"
        aria-expanded={open}
        className="ml-1 inline-flex cursor-pointer items-center rounded p-0.5 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:text-blue-300"
      >
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white/90 p-1 text-neutral-700 shadow-lg backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              copy();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <LinkIcon className="size-3.5" aria-hidden="true" />
            Copy link
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("x")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <BrandGlyph name="x" className="size-3.5" />
            Share on X
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("linkedin")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <BrandGlyph name="linkedin" className="size-3.5" />
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
