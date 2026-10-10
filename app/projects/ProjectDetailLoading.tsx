import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const bar = "rounded bg-border-primary/60 dark:bg-white/15";

export default function ProjectDetailLoading() {
  return (
    <div role="status" aria-label="Loading project details" className="relative mt-14 min-w-0 bg-bg-primary">
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
            <div className="relative mx-auto max-w-4xl text-center">
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Project</p>
              <div className={`mx-auto mt-4 h-[46px] w-3/4 max-w-sm md:h-14 ${bar}`} />
              <div className="mx-auto mt-4 max-w-2xl space-y-2 py-1 sm:hidden">
                {["w-full", "w-11/12", "w-4/5", "w-1/2"].map((width, index) => <div key={index} className={`mx-auto h-4 ${width} ${bar}`} />)}
              </div>
              <div className="mx-auto mt-4 hidden max-w-2xl space-y-2 py-1 sm:block">
                <div className={`h-4 w-full ${bar}`} />
                <div className={`mx-auto h-4 w-3/5 ${bar}`} />
              </div>
            </div>
          </div>
        </GridWrapper>

        <div className="mx-auto mt-14 max-w-6xl px-2 sm:px-4">
          <div className="rounded-3xl border border-border-primary bg-white dark:bg-white/[0.02]">
            <div className="grid lg:grid-cols-2">
              <div className="px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5 lg:px-8 lg:pb-8">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">At a glance</span>
                  <span className={`h-11 w-28 shrink-0 ${bar}`} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-6 sm:-mt-1">
                  {Array.from({ length: 4 }, (_, index) => <div key={index}>
                    <div className={`h-3 w-20 max-w-full ${bar}`} />
                    <div className={`mt-2 h-4 w-24 max-w-full ${bar}`} />
                  </div>)}
                </div>
              </div>
              <div className="border-t border-border-primary px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5 lg:border-l lg:border-t-0 lg:px-8 lg:pb-8">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">Tech stack</span>
                <div className="mt-6 flex flex-wrap gap-2">
                  {Array.from({ length: 16 }, (_, index) => <span key={index} className={`h-8 rounded-full border border-border-primary bg-neutral-50 dark:bg-white/[0.04] ${index % 3 === 0 ? "w-24" : index % 3 === 1 ? "w-20" : "w-16"}`} />)}
                </div>
              </div>
            </div>
            <div className="border-t border-border-primary px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5 lg:px-8 lg:pb-8">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">Tags</span>
              <div className="mt-6 flex flex-wrap gap-2">
                {Array.from({ length: 8 }, (_, index) => <span key={index} className={`h-8 rounded-full border border-border-primary bg-neutral-50 dark:bg-white/[0.04] ${index % 2 ? "w-24" : "w-32"}`} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl px-2 sm:px-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="aspect-[3/2] rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:rounded-3xl" />
            <div className="hidden aspect-[3/2] rounded-3xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] lg:block" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 sm:mt-8">
            <span className={`size-9 rounded-full ${bar}`} />
            <span className={`h-1 w-24 ${bar}`} />
            <span className={`size-9 rounded-full ${bar}`} />
            <span className={`size-9 rounded-full ${bar}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
