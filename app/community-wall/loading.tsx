import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

export default function CommunityWallLoading() {
  return (
    <div className="relative mt-14">
      <span className="sr-only" role="status">Loading Community Wall</span>
      <div aria-hidden="true">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className={`relative mx-auto max-w-3xl space-y-4 text-center ${pulse}`}>
            <div className="mx-auto h-3 w-36 rounded bg-border-primary/40" />
            <div className="mx-auto h-14 w-full max-w-xl rounded bg-border-primary/35" />
            <div className="mx-auto h-12 w-full max-w-2xl rounded bg-border-primary/25" />
          </div>
        </div>
      </GridWrapper>
      <section className="mx-auto mt-14 w-full max-w-6xl px-2 sm:px-8 lg:px-0">
        <div className="flex min-h-14 items-center justify-between"><div className={`h-3 w-28 rounded bg-border-primary/35 ${pulse}`} /><div className={`h-3 w-20 rounded bg-border-primary/25 ${pulse}`} /></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className={`h-[224px] rounded-2xl bg-border-primary/15 ${pulse}`} />)}
        </div>
      </section>
      <div className={`mx-2 mt-28 h-[464px] rounded-3xl bg-border-primary/15 sm:mx-4 md:h-[458px] ${pulse}`} />
      </div>
    </div>
  );
}
