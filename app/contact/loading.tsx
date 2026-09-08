import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

export default function ContactLoading() {
  return (
    <div className="relative mt-14" role="status">
      <span className="sr-only">Loading contact page</span>
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className={`relative mx-auto flex max-w-3xl flex-col items-center text-center ${pulse}`}>
            <div className="h-4 w-20 rounded bg-border-primary/50" />
            <div className="relative mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight md:text-[56px] md:tracking-[-1.5px]">
              <span className="invisible">
                A project, a role, or <span className="px-1 pb-1 italic">just a hello?</span>
              </span>
              <span className="absolute inset-0 rounded bg-border-primary/40" />
            </div>
            <div className="relative mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6">
              <span className="invisible">
                Share the context, goals, and constraints. You will receive a
                thoughtful response, usually within one business day.
              </span>
              <span className="absolute inset-0 rounded bg-border-primary/30" />
            </div>
          </div>
        </div>
      </GridWrapper>

      <div className="mt-14 grid items-start gap-3 px-2 sm:px-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
        <div className={`h-[420px] rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] ${pulse}`}>
          <div className="h-full rounded-2xl bg-border-primary/20" />
        </div>
        <div className={`h-[660px] rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] ${pulse}`}>
          <div className="h-full rounded-2xl bg-border-primary/20" />
        </div>
      </div>

      <div className={`mx-2 mt-28 h-[390px] rounded-3xl bg-border-primary/15 sm:mx-4 ${pulse}`} />
    </div>
  );
}
