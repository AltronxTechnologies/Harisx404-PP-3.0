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
            <div className={`mb-6 h-[74px] border-y border-border-primary bg-border-primary/10 ${pulse}`} />
            <div className={`min-h-[1200px] rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8 ${pulse}`}>
              <div className="h-28 border-b-4 border-[#1e64c8]/30" />
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid gap-4 border-t border-neutral-200 py-6 md:grid-cols-[172px_1fr] md:gap-8">
                  <div className="h-3 w-32 rounded bg-neutral-200" />
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 rounded bg-neutral-200" />
                    <div className="h-3 w-full rounded bg-neutral-100" />
                    <div className="h-3 w-5/6 rounded bg-neutral-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
