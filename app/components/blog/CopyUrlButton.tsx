"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Link as LinkIcon } from "lucide-react";

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
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("linkedin")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
            </svg>
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
