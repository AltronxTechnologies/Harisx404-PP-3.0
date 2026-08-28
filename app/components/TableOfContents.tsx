"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useActiveSection } from "@/app/hooks/useActiveSection";
import type { TocHeading } from "@/app/lib/toc-utils";

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);
  const activeId = useActiveSection({ headingIds: headings.map((heading) => heading.slug) });
  const active = headings.find((heading) => heading.slug === activeId) || headings[0];

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("keydown", (event) => event.key === "Escape" && close());
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (!headings.length) return null;

  const selectHeading = (slug: string) => {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `#${slug}`);
    setOpen(false);
  };

  return (
    <nav aria-label="Table of contents" className="fixed bottom-[30px] left-1/2 z-[99] flex -translate-x-1/2 flex-col items-center">
      <div className={`relative overflow-hidden rounded-2xl bg-white/70 text-neutral-900 shadow-[0_0_0_0.8px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.06),inset_0_0.5px_0.5px_0.5px_rgba(255,255,255,0.6)] backdrop-blur-md dark:bg-neutral-800/80 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)] ${open ? "h-[min(72vh,560px)] w-[min(360px,calc(100vw-2rem))]" : "h-[52px] w-[min(280px,calc(100vw-2rem))]"}`}>
        {!open ? <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 flex w-full items-center gap-3 px-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <span aria-hidden="true" className="relative flex size-1.5 shrink-0"><span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40 motion-reduce:animate-none" /><span className="relative inline-flex size-1.5 rounded-full bg-current" /></span>
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">{active.text}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </button> : <div className="absolute inset-0 flex flex-col">
          <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4"><span className="font-mono text-[10px] uppercase tracking-[0.28em] text-current/55">Table of contents</span><button type="button" onClick={() => setOpen(false)} aria-label="Close table of contents" className="flex size-7 items-center justify-center rounded-full text-current/55 transition-colors hover:bg-current/10 hover:text-current"><X className="size-4" /></button></div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4"><div className="flex flex-col gap-0.5">{headings.map((heading) => <button key={heading.slug} type="button" onClick={() => selectHeading(heading.slug)} className={`group relative flex w-full shrink-0 items-center rounded-lg border-none py-2 pr-3 text-left text-sm transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${activeId === heading.slug ? "bg-current/[0.08] font-medium text-current" : "bg-transparent text-current/50 hover:bg-current/[0.05] hover:text-current"} ${heading.level === 3 ? "pl-6" : "pl-4"}`}><span aria-hidden="true" className={`absolute left-1 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-current transition-opacity ${activeId === heading.slug ? "opacity-100" : "opacity-0"}`} /><span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{heading.text}</span></button>)}</div></div>
        </div>}
      </div>
    </nav>
  );
}
