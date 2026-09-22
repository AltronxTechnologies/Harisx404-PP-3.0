"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link as LinkIcon, X } from "lucide-react";

type CopyState = "idle" | "copied" | "error";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

export function EntryLinkButton({ entryId }: { entryId: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await copyText(`${window.location.origin}/community-wall#entry-${entryId}`);
      setState("copied");
    } catch {
      setState("error");
    }
    timer.current = setTimeout(() => setState("idle"), 2200);
  };

  const label = state === "copied" ? "Link copied" : state === "error" ? "Copy failed" : "Copy link to this note";
  return (
    <div className="relative shrink-0">
      <button type="button" onClick={copy} aria-label={label} title={label} className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary active:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12]">
        {state === "copied" ? <Check aria-hidden="true" className="size-4 text-emerald-500" /> : state === "error" ? <X aria-hidden="true" className="size-4 text-red-500" /> : <LinkIcon aria-hidden="true" className="size-4" />}
      </button>
      {state !== "idle" && <span role="status" className={`pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border border-border-primary bg-bg-primary px-2 py-1 font-mono text-[9px] uppercase tracking-wide shadow-sm ${state === "copied" ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>{state === "copied" ? "Copied" : "Copy failed"}</span>}
    </div>
  );
}
