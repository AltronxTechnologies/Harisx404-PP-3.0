import type { ReactNode } from "react";

export function ArticleFaq({ question, anchorId, children }: { question: string; anchorId: string; children: ReactNode }) {
  return (
    <details
      id={anchorId}
      name="article-faq"
      className="group not-prose scroll-mt-24 border border-border-primary bg-white/60 dark:bg-white/[0.02]"
      style={{ borderRadius: 14, marginTop: 8 }}
    >
      <summary
        className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-text-primary focus-visible:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary [&::-webkit-details-marker]:hidden"
        style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}
      >
        <span>{question}</span>
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-border-primary px-5 pb-5 pt-1 text-text-secondary [&>*:first-child]:mt-3 [&>*:last-child]:mb-0">
        {children}
      </div>
    </details>
  );
}
