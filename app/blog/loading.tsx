import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02]">
      <div className="aspect-[16/11] animate-pulse rounded-2xl bg-border-primary/40 motion-reduce:animate-none" />
      <div className="px-2 pb-3 pt-4">
        <div className="h-6 w-4/5 animate-pulse rounded bg-border-primary/50 motion-reduce:animate-none" />
        <div className="mt-3 h-3.5 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
        <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
        <div className="mt-6 h-3 w-2/5 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default function BlogLoading() {
  return (
    <div className="relative mt-14 min-h-screen pb-24">
      <p className="sr-only" role="status">Loading articles</p>
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className="relative mx-auto flex max-w-3xl animate-pulse flex-col items-center text-center motion-reduce:animate-none">
            <div className="h-3 w-28 rounded bg-border-primary/50" />
            <div className="mt-4 h-14 w-full max-w-md rounded bg-border-primary/40" />
            <div className="mt-4 h-4 w-full max-w-xl rounded bg-border-primary/30" />
            <div className="mt-2 h-4 w-4/5 max-w-lg rounded bg-border-primary/30" />
          </div>
        </div>
      </GridWrapper>

      <div className="mt-14 flex items-center gap-2 border-y border-border-primary px-2 py-4 sm:px-4">
        <div className="h-8 w-28 animate-pulse rounded-full bg-border-primary/40 motion-reduce:animate-none" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-border-primary/30 motion-reduce:animate-none" />
        <div className="ml-auto size-8 animate-pulse rounded-lg bg-border-primary/40 motion-reduce:animate-none" />
        <div className="size-8 animate-pulse rounded-lg bg-border-primary/40 motion-reduce:animate-none" />
      </div>

      <div className="mt-14 space-y-14 px-2 sm:px-4">
        <section>
          <div className="mb-6 h-3 w-36 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
          <div className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] md:flex">
            <div className="aspect-video animate-pulse rounded-2xl bg-border-primary/40 motion-reduce:animate-none md:min-h-[360px] md:w-1/2" />
            <div className="flex-1 px-6 py-8">
              <div className="h-3 w-40 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
              <div className="mt-4 h-7 w-4/5 animate-pulse rounded bg-border-primary/50 motion-reduce:animate-none" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
            </div>
          </div>
        </section>
        <section>
          <div className="mb-6 border-b border-border-primary pb-4">
            <div className="h-3 w-32 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
