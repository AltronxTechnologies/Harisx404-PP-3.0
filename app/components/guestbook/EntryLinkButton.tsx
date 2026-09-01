"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

/** Copy-a-link-to-this-entry button in the card meta bar (reference has the
 *  same affordance on each guestbook card). */
export function EntryLinkButton({ entryId }: { entryId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = `${window.location.origin}/community-wall#entry-${entryId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copied" : "Copy link to this note"}
      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 active:scale-90 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
    >
      {copied ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />}
    </button>
  );
}
