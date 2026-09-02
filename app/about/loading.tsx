import { GridWrapper } from "@/app/components/GridWrapper";

const pulse = "animate-pulse motion-reduce:animate-none";

function SectionHeaderSkeleton() {
  return (
    <div className={`mx-auto flex max-w-xl flex-col items-center ${pulse}`}>
      <div className="h-3 w-24 rounded bg-border-primary/60" />
      <div className="mt-4 h-12 w-72 max-w-full rounded bg-border-primary/40 sm:w-96" />
    </div>
  );
}

export default function AboutLoading() {
  return (
    <div className="relative mt-14 space-y-28" aria-label="Loading About page">
      <GridWrapper>
        <div className="px-4 xl:px-0">
          <SectionHeaderSkeleton />
          <div className={`mx-auto mt-14 max-w-3xl space-y-2 ${pulse}`}>
            <div className="h-3.5 w-full rounded bg-border-primary/35" />
            <div className="mx-auto h-3.5 w-5/6 rounded bg-border-primary/35" />
            <div className="mx-auto h-3.5 w-2/3 rounded bg-border-primary/35" />
          </div>
        </div>
      </GridWrapper>

      <div className="space-y-14">
        <GridWrapper>
          <SectionHeaderSkeleton />
        </GridWrapper>
        <div className="border-y border-border-primary">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className={`grid gap-5 border-b border-border-primary px-6 py-12 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(0,4fr)] ${pulse}`}
            >
              <div className="space-y-3">
                <div className="h-3 w-32 rounded bg-border-primary/50" />
                <div className="h-6 w-40 rounded bg-border-primary/50" />
                <div className="h-3 w-28 rounded bg-border-primary/35" />
              </div>
              <div className="space-y-3">
                <div className="h-6 w-64 max-w-full rounded bg-border-primary/50" />
                <div className="h-3.5 w-full rounded bg-border-primary/35" />
                <div className="h-3.5 w-4/5 rounded bg-border-primary/35" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
