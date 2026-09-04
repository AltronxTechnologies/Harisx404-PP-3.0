import type { ReactionSummary, ReactionType } from "@/app/blog/data";

const reactionGlyphs: Record<ReactionType, string> = {
  like: "👍",
  heart: "♥",
  celebrate: "✦",
  insightful: "💡",
};

const reactionNames: Record<ReactionType, string> = {
  like: "like",
  heart: "heart",
  celebrate: "celebrate",
  insightful: "insightful",
};

export function ReactionSummaryPill({ summary }: { summary?: ReactionSummary }) {
  if (!summary || summary.total <= 0) return null;

  const details = summary.top
    .map(({ type, count }) => `${count} ${reactionNames[type]}`)
    .join(", ");

  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border-primary bg-bg-primary px-2.5 text-text-secondary"
      role="img"
      aria-label={`${summary.total} ${summary.total === 1 ? "reaction" : "reactions"}: ${details}. Open the article to react.`}
      title="Open the article to react"
    >
      <span className="flex -space-x-1" aria-hidden>
        {summary.top.map(({ type }) => (
          <span
            key={type}
            className="flex size-5 items-center justify-center rounded-full border border-border-primary bg-white text-[11px] leading-none shadow-sm dark:bg-[#1A1F2B]"
          >
            {reactionGlyphs[type]}
          </span>
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums">
        {summary.total}
      </span>
    </span>
  );
}
