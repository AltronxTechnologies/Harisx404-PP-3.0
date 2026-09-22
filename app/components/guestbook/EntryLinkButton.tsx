"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

/** Copy-a-link-to-this-entry button in the card meta bar (reference has the
 *  same affordance on each guestbook card). */
export function EntryLinkButton({ entryId }: { entryId: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      const url = `${window.location.origin}/community-wall#entry-${entryId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copied" : "Copy link to this note"}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary active:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12]"
    >
      {copied ? <Check aria-hidden="true" className="size-4" /> : <LinkIcon aria-hidden="true" className="size-4" />}
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </button>
  );
}
