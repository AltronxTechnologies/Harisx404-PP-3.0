/* Route-level loading skeleton for /projects — mirrors the real page's
   geometry (header, control row, staggered two-column card grid) so the
   content pop-in feels like a fill, not a layout shift. Pure server
   component: renders instantly while project data streams in. */

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Meta row: index + tag pills left, quarter right */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-6 rounded bg-border-primary/60" />
          <div className="h-6 w-24 rounded-full bg-border-primary/40" />
          <div className="h-6 w-20 rounded-full bg-border-primary/40" />
        </div>
        <div className="h-6 w-16 rounded-full bg-border-primary/40" />
      </div>
      {/* Cover panel */}
      <div className="h-72 rounded-2xl bg-border-primary/30 xl:h-96" />
      {/* Description lines + action row */}
      <div className="mt-6 space-y-2.5">
        <div className="h-3.5 w-full max-w-xl rounded bg-border-primary/40" />
        <div className="h-3.5 w-4/5 max-w-xl rounded bg-border-primary/40" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-3 w-16 rounded bg-border-primary/40" />
        <div className="h-3 w-28 rounded bg-border-primary/40" />
      </div>
    </div>
  );
}

export default function ProjectsLoading() {
  return (
    <div className="bg-bg-primary px-4 pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex animate-pulse flex-col items-center text-center">
          <div className="h-3 w-36 rounded bg-border-primary/50" />
          <div className="mt-5 h-12 w-72 rounded bg-border-primary/40 sm:w-96" />
          <div className="mt-5 h-4 w-full max-w-md rounded bg-border-primary/30" />
          <div className="mt-2 h-4 w-3/4 max-w-sm rounded bg-border-primary/30" />
        </div>

        {/* Controls row: search + tag pills (2rem, matching the live page) */}
        <div className="mx-auto mt-10 flex animate-pulse flex-wrap items-center justify-center gap-2">
          <div className="h-[2rem] w-full max-w-[260px] rounded-full bg-border-primary/40 sm:w-56" />
          <div className="h-[2rem] w-14 rounded-full bg-border-primary/40" />
          <div className="h-[2rem] w-20 rounded-full bg-border-primary/40" />
          <div className="h-[2rem] w-32 rounded-full bg-border-primary/40" />
          <div className="h-[2rem] w-16 rounded-full bg-border-primary/40" />
          <div className="h-[2rem] w-20 rounded-full bg-border-primary/40" />
        </div>

        {/* Grid — single column below xl, staggered two columns from xl */}
        <div className="mt-14 space-y-20 xl:hidden">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="mt-14 hidden xl:flex xl:gap-6">
          <div className="ml-2 min-w-0 flex-1 space-y-20">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="mr-2 mt-[213px] min-w-0 flex-1 space-y-20">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
