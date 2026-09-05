"use client";

import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const rawPage = searchParams.get("page");
  const page = rawPage && /^\d+$/.test(rawPage)
    ? Number.parseInt(rawPage, 10)
    : 1;
  const firstPage = !Number.isFinite(page) || page <= 1;
  const compactGridCount = firstPage ? 6 : 8;

  return (
    <div className="relative mt-14 min-h-screen pb-24">
      <p className="sr-only" role="status">Loading articles</p>
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <div className="relative mx-auto flex max-w-3xl animate-pulse flex-col items-center text-center motion-reduce:animate-none">
            <div className="h-4 w-28 rounded bg-border-primary/50" />
            <div className="mt-4 h-[92px] w-full max-w-md rounded bg-border-primary/40 sm:h-[46px] md:h-14" />
            <div className="mt-4 h-[72px] w-full max-w-2xl rounded bg-border-primary/30 max-[374px]:h-24 sm:h-12" />
          </div>
        </div>
      </GridWrapper>

      <div className="mt-14 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:px-4 lg:flex-row lg:items-center lg:gap-2">
        <div className="order-2 flex items-center gap-2 lg:order-1 lg:min-w-0 lg:flex-1">
          <div className="h-8 w-28 animate-pulse rounded-full bg-border-primary/40 motion-reduce:animate-none" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-border-primary/30 motion-reduce:animate-none" />
        </div>
        <div className="order-1 flex w-full items-center gap-2 lg:order-2 lg:w-auto">
          <div className="h-8 min-w-0 flex-1 animate-pulse rounded-lg bg-border-primary/40 motion-reduce:animate-none lg:w-64 lg:flex-none" />
          <div className="size-8 animate-pulse rounded-lg bg-border-primary/40 motion-reduce:animate-none" />
        </div>
      </div>

      <div className="mt-10 space-y-14 px-2 sm:px-4">
        {firstPage && (
          <section>
            <div className="mb-6 h-[16.5px] w-36 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
            <div className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] md:flex">
              <div className="aspect-[16/11] animate-pulse rounded-2xl bg-border-primary/40 motion-reduce:animate-none md:aspect-auto md:min-h-[260px] md:w-1/2 lg:min-h-[300px]" />
              <div className="flex flex-1 flex-col px-2 pb-3 pt-4 md:justify-center md:px-6 md:py-6 lg:px-8 lg:py-8">
                <div className="h-[16.5px] w-40 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
                <div className="h-[142px] md:h-[150px]">
                  <div className="mt-3 h-7 w-4/5 animate-pulse rounded bg-border-primary/50 motion-reduce:animate-none" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
                  <div className="mt-1.5 h-4 w-full animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
                  <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
                </div>
                <div className="mt-auto flex min-h-7 items-center justify-between gap-2.5 pt-4">
                  <div className="h-7 w-24 animate-pulse rounded-full bg-border-primary/30 motion-reduce:animate-none" />
                  <div className="h-6 w-24 animate-pulse rounded bg-border-primary/30 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </section>
        )}
        <section>
          <div className="mb-6 border-b border-border-primary pb-4">
            <div className="h-3 w-32 animate-pulse rounded bg-border-primary/40 motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className={
                  index >= compactGridCount
                    ? "hidden lg:block"
                    : ""
                }
              >
                <CardSkeleton />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
