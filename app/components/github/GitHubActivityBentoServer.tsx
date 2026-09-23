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
    <BentoCard height={height} appearance="home" className="!p-5 animate-pulse motion-reduce:animate-none">
      <div aria-hidden="true" className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-border-primary/40" />
          <div className="h-5 w-14 rounded-full bg-border-primary/30" />
        </div>
        <div className="mt-5 min-h-[96px] flex-1 rounded-xl bg-border-primary/20" />
      </div>
      <span className="sr-only" role="status">Loading GitHub activity</span>
    </BentoCard>
  );
}
