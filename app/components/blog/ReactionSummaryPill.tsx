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

const reactionOrder: ReactionType[] = ["like", "heart", "celebrate", "insightful"];

export function ReactionSummaryPill({ summary }: { summary?: ReactionSummary }) {
  if (!summary || summary.total <= 0) return null;

  const details = reactionOrder
    .filter((type) => summary.counts[type] > 0)
    .map((type) => `${summary.counts[type]} ${reactionNames[type]}`)
    .join(", ");

  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border-primary bg-bg-primary px-2 text-text-secondary"
      role="img"
      aria-label={`${summary.total} ${summary.total === 1 ? "reaction" : "reactions"}: ${details}. Open the article to react.`}
      title="Open the article to react"
    >
      <span className="flex -space-x-1" aria-hidden>
        {reactionOrder.map((type) => (
          <span
            key={type}
            className={`flex size-4 items-center justify-center rounded-full border border-border-primary bg-white text-[10px] leading-none shadow-sm dark:bg-[#1A1F2B] ${
              summary.counts[type] > 0 ? "opacity-100" : "opacity-40 grayscale"
            }`}
          >
            {reactionGlyphs[type]}
          </span>
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums">
        {summary.total > 999 ? "999+" : summary.total}
      </span>
    </span>
  );
}
