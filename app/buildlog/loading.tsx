import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

export default function BuildlogLoading() {
  return (
    <div className="relative mt-14 pb-24">
      <span className="sr-only" role="status">Loading Buildlog</span>
      <div aria-hidden="true">
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
            <div className={`relative mx-auto flex max-w-3xl flex-col items-center text-center ${pulse}`}>
              <div className="h-4 w-40 rounded bg-border-primary/50" />
              <div className="mt-4 h-14 w-full max-w-lg rounded bg-border-primary/40" />
              <div className="mt-4 h-12 w-full max-w-xl rounded bg-border-primary/30" />
            </div>
          </div>
        </GridWrapper>
        <section className="mt-14 px-2 sm:px-4">
          <div className="-mx-2 flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:-mx-4 sm:px-8">
            <div className={`h-3 w-32 rounded bg-border-primary/40 ${pulse}`} />
            <div className="flex items-center gap-3">
              <div className={`h-4 w-20 rounded bg-border-primary/30 ${pulse}`} />
              <div className="h-4 w-px bg-border-primary" />
              <div className={`h-4 w-20 rounded bg-border-primary/30 ${pulse}`} />
            </div>
          </div>
          {[0, 1, 2].map((project) => (
            <div key={project} className="relative grid before:absolute before:-left-2 before:-right-2 before:top-0 before:h-[1.5px] before:bg-neutral-400/60 before:content-[''] dark:before:bg-white/20 sm:before:-left-4 sm:before:-right-4 lg:grid-cols-12">
              <div className="border-b border-border-primary lg:col-span-4 lg:border-b-0 xl:col-span-3">
                <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border-primary px-4 sm:px-6">
                  <div className={`h-3 w-6 rounded bg-border-primary/35 ${pulse}`} />
                  <div className={`h-3 w-20 rounded bg-border-primary/30 ${pulse}`} />
                </div>
                <div className="space-y-3 p-4 lg:p-6">
                  <div className={`h-8 w-3/5 rounded bg-border-primary/45 ${pulse}`} />
                  <div className={`h-6 w-2/5 rounded bg-border-primary/30 ${pulse}`} />
                  <div className={`h-14 w-full rounded bg-border-primary/25 ${pulse}`} />
                </div>
              </div>
              <div className="lg:col-span-8 lg:border-l lg:border-border-primary xl:col-span-9">
                <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border-primary px-4 sm:px-6">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-3 w-36 rounded bg-border-primary/40 ${pulse}`} />
                    <div className={`h-6 w-12 rounded-full bg-border-primary/30 ${pulse}`} />
                  </div>
                  <div className={`size-4 rounded bg-border-primary/30 ${pulse}`} />
                </div>
                <div className="flex min-h-12 items-center border-b border-border-primary px-4 sm:px-6">
                  <div className={`h-3 w-28 rounded bg-border-primary/35 ${pulse}`} />
                </div>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex h-[112px] items-center gap-4 border-b border-border-primary px-4 min-[430px]:h-[104px] sm:px-6">
                    <div className={`size-5 shrink-0 rounded-md bg-border-primary/35 ${pulse}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-2/3 rounded bg-border-primary/40 ${pulse}`} />
                      <div className={`h-3 w-4/5 rounded bg-border-primary/25 ${pulse}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
