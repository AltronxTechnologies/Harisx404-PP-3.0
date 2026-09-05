import type { ReactionSummary, ReactionType } from "@/app/blog/data";
import { ReactionIcon } from "@/app/components/ReactionIcon";

const reactionNames: Record<ReactionType, string> = {
  like: "like",
  heart: "heart",
  celebrate: "celebrate",
  insightful: "insightful",
};

const reactionOrder: ReactionType[] = ["like", "heart", "celebrate", "insightful"];

export function ReactionSummaryPill({ summary }: { summary?: ReactionSummary }) {
  const counts = summary?.counts || {
    like: 0,
    heart: 0,
    celebrate: 0,
    insightful: 0,
  };
  const total = summary?.total;

  const details = reactionOrder
    .filter((type) => counts[type] > 0)
    .map((type) => `${counts[type]} ${reactionNames[type]}`)
    .join(", ");

  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border-primary bg-neutral-50/80 px-2 text-text-secondary shadow-sm ring-1 ring-inset ring-white/60 dark:bg-white/[0.04] dark:ring-white/[0.04]"
      role="img"
      aria-label={
        total === undefined
          ? "Reaction count temporarily unavailable. Open the article to react."
          : total > 0
          ? `${total} ${total === 1 ? "reaction" : "reactions"}: ${details}. Open the article to react.`
          : "0 reactions. Open the article to be the first to react."
      }
      title="Open the article to react"
    >
      <span className="flex -space-x-1" aria-hidden>
        {reactionOrder.map((type) => (
          <span
            key={type}
            className={`flex size-5 items-center justify-center rounded-full border border-border-primary bg-white leading-none shadow-sm dark:bg-[#1A1F2B] [&>svg]:size-4 ${
              counts[type] > 0 ? "opacity-100" : "opacity-70"
            }`}
          >
            <ReactionIcon type={type} active />
          </span>
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums">
        {total === undefined ? "–" : total > 999 ? "999+" : total}
      </span>
    </span>
  );
}
