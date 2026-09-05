import { DoubleArrow } from "@/app/components/home/DoubleArrow";

export function ArticleCardArrow() {
  return (
    <span
      aria-hidden
      className="inline-flex size-[25px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-primary bg-neutral-50/50 transition-colors group-hover:border-neutral-400/70 group-hover:bg-neutral-100 group-active:border-neutral-400/70 dark:bg-white/[0.03] dark:group-hover:border-white/25 dark:group-hover:bg-white/[0.07] dark:group-active:border-white/25"
    >
      <DoubleArrow />
    </span>
  );
}
