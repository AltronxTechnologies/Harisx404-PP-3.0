import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

export default function ResumeLoading() {
  return (
    <div className="relative mt-14">
      <span className="sr-only" role="status">Loading resume</span>
      <div aria-hidden="true">
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
            <div className={`relative mx-auto flex max-w-3xl flex-col items-center text-center ${pulse}`}>
              <div className="h-4 w-20 rounded bg-border-primary/50" />
              <div className="mt-4 h-14 w-full max-w-lg rounded bg-border-primary/40" />
              <div className="mt-4 h-12 w-full max-w-xl rounded bg-border-primary/30" />
              <div className="mt-7 flex gap-3">
                <div className="h-11 w-36 rounded-full bg-border-primary/45" />
                <div className="h-11 w-36 rounded-full bg-border-primary/30" />
              </div>
            </div>
          </div>
        </GridWrapper>

        <div className="mt-14 px-2 sm:px-4">
          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-border-primary bg-white dark:bg-white/[0.02]">
              <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className={`hidden min-h-[340px] border-r border-border-primary bg-border-primary/10 lg:block ${pulse}`} />
                <div className="space-y-5 p-5 sm:p-8 lg:p-10">
                  <div className={`h-3 w-28 rounded bg-border-primary/40 ${pulse}`} />
                  <div className={`h-10 w-64 max-w-full rounded bg-border-primary/35 ${pulse}`} />
                  <div className={`h-12 w-full rounded bg-border-primary/25 ${pulse}`} />
                  <div className={`h-32 rounded-2xl border border-border-primary bg-border-primary/15 ${pulse}`} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={`h-12 rounded-full bg-border-primary/45 ${pulse}`} />
                    <div className={`h-12 rounded-full bg-border-primary/25 ${pulse}`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={`h-48 rounded-2xl border border-border-primary bg-border-primary/10 ${pulse}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
