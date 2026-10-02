import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

export default function BlogArticleLoading() {
  return (
    <div className="blog-detail relative mt-14 min-w-0" aria-busy="true">
      <p className="sr-only" role="status">Loading article</p>
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center" style={{ maxWidth: "680px" }} aria-hidden="true">
            <div className="h-6 w-12 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
            <div className="mt-4 h-[92px] w-full max-w-xl animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none md:h-[112px]" />
            <div className="mt-4 h-12 w-full max-w-2xl animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
          </div>
        </div>
      </GridWrapper>
      <div className="mx-auto mt-14 w-full max-w-[680px] px-4 md:px-6" aria-hidden="true">
        <div className="flex items-center justify-between border-b border-border-primary pb-4">
          <div className="h-4 w-40 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
          <div className="h-4 w-24 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
