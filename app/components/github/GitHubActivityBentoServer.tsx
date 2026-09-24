import { BentoCard } from "@/app/components/BentoCard";
import { GitHubActivityBento } from "@/app/components/home/HomeBento";
import { fetchGitHubActivity } from "@/app/lib/live-stats";

export async function GitHubActivityBentoServer({
  height,
}: {
  height?: string;
}) {
  const github = await fetchGitHubActivity();
  return <GitHubActivityBento github={github} height={height} />;
}

export function GitHubActivityBentoSkeleton({
  height = "h-auto sm:h-[240px] lg:h-[220px]",
}: {
  height?: string;
}) {
  return (
    <BentoCard height={height} appearance="home" className="!px-5 !py-4 animate-pulse motion-reduce:animate-none">
      <div aria-hidden="true" className="flex h-full flex-col">
        <div className="relative text-center">
          <div className="mx-auto flex w-fit items-center gap-2">
            <div className="h-5 w-32 rounded bg-border-primary/40" />
            <div className="h-4 w-14 rounded-full bg-border-primary/30" />
          </div>
        </div>
        <div className="mt-3 min-h-[104px] flex-1 rounded-xl bg-border-primary/20" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-2.5 w-24 rounded bg-border-primary/25" />
          <div className="h-2.5 w-20 rounded bg-border-primary/25" />
        </div>
      </div>
      <span className="sr-only" role="status">Loading GitHub activity</span>
    </BentoCard>
  );
}
