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
    <BentoCard height={height} appearance="home" className="animate-pulse motion-reduce:animate-none">
      <div aria-hidden="true" className="flex h-full flex-col">
        <div className="mx-auto h-5 w-36 rounded bg-border-primary/40" />
        <div className="mx-auto mt-2 h-4 w-56 max-w-full rounded bg-border-primary/25" />
        <div className="mt-5 min-h-[92px] flex-1 rounded-xl bg-border-primary/20" />
        <div className="mx-auto mt-3 h-3 w-40 rounded bg-border-primary/25" />
      </div>
      <span className="sr-only" role="status">Loading GitHub activity</span>
    </BentoCard>
  );
}
