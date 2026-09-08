import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

function LinkGroupSkeleton() {
  return (
    <section>
      <div className="mb-4 border-b border-border-primary pb-4">
        <div className={`h-3 w-28 rounded bg-border-primary/40 ${pulse}`} />
        <div className={`mt-2 h-3.5 w-4/5 rounded bg-border-primary/30 ${pulse}`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`h-[92px] rounded-2xl border border-border-primary bg-border-primary/15 ${pulse}`} />
        ))}
      </div>
    </section>
  );
}

export default function LinksLoading() {
  return (
    <div className="relative mt-14">
      <span className="sr-only" role="status">Loading links</span>
      <div aria-hidden="true">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className={`relative mx-auto flex max-w-3xl flex-col items-center text-center ${pulse}`}>
            <div className="h-4 w-20 rounded bg-border-primary/50" />
            <div className="relative mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight md:text-[56px] md:tracking-[-1.5px]">
              <span className="invisible">One handle, <span className="px-1 pb-1 italic">everywhere.</span></span>
              <span className="absolute inset-0 rounded bg-border-primary/40" />
            </div>
            <div className="relative mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6">
              <span className="invisible">Find my code, credentials, professional profiles, and the clearest way to start a conversation.</span>
              <span className="absolute inset-0 rounded bg-border-primary/30" />
            </div>
          </div>
        </div>
      </GridWrapper>

      <div className="mt-14 grid items-start gap-3 px-2 sm:px-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
        <div className={`h-[450px] rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] ${pulse}`}><div className="h-full rounded-2xl bg-border-primary/20" /></div>
        <div className="space-y-10 rounded-3xl border border-border-primary bg-white p-4 dark:bg-white/[0.02] sm:p-6 lg:p-8">
          <LinkGroupSkeleton />
          <LinkGroupSkeleton />
        </div>
      </div>
      <div className={`mx-2 mt-28 h-[464px] rounded-3xl bg-border-primary/15 sm:mx-4 md:h-[458px] ${pulse}`} />
      </div>
    </div>
  );
}
