/* Route-level loading skeleton for /projects. It mirrors the live blueprint
   header, controls, card frame, and responsive grid so content fills in without
   changing composition. */

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 flex h-[26.5px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-3 w-5 rounded bg-border-primary/60" />
          <div className="h-px w-4 bg-border-primary sm:w-7" />
          <div className="h-[26.5px] w-24 rounded-full bg-border-primary/40" />
          <div className="hidden h-[26.5px] w-20 rounded-full bg-border-primary/40 sm:block" />
        </div>
        <div className="h-[26.5px] w-[74px] shrink-0 rounded-lg bg-border-primary/40" />
      </div>

      <div className="relative mb-5 border-t border-dotted border-border-primary" />

      <div className="h-72 overflow-hidden rounded-[22px] border-8 border-white bg-border-primary/20 shadow-[0_0_0_0.8px_rgba(0,0,0,0.2),0_9.5px_28.5px_-11.4px_rgba(0,0,0,0.4)] dark:border-zinc-800 dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_#4d4d4d,0_9.5px_28.5px_-11.4px_rgba(0,0,0,0.4)] xl:h-96">
        <div className="flex h-full flex-col p-6 pb-0 md:p-8 md:pb-0">
          <div className="flex items-center justify-between gap-4">
            <div className="h-7 w-44 max-w-[70%] rounded bg-border-primary/60" />
            <div className="h-4 w-6 rounded bg-border-primary/50" />
          </div>
          <div className="mx-auto mt-7 w-[94%] flex-1 rounded-t-[11px] border-[3px] border-b-0 border-white/70 bg-border-primary/50 md:mt-11 md:w-[93%] lg:mt-14 lg:w-[92%]" />
        </div>
      </div>

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

function HeaderSkeleton() {
  return (
    <div className="relative -mt-8 px-4 text-center xl:px-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 bottom-[-72px] top-[-128px] sm:-inset-x-7 xl:-inset-x-3 [background-image:linear-gradient(to_right,rgba(100,106,124,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,106,124,0.09)_1px,transparent_1px),linear-gradient(to_right,rgba(100,106,124,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,106,124,0.22)_1px,transparent_1px)] [background-size:24px_24px,24px_24px,120px_120px,120px_120px] [mask-image:radial-gradient(ellipse_95%_110%_at_50%_0%,black_35%,transparent_92%)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] sm:top-[-144px] md:top-[-176px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 bottom-[-72px] top-[-128px] hidden bg-[radial-gradient(ellipse_55%_45%_at_50%_18%,rgba(148,163,184,0.07),transparent_70%)] dark:block sm:-inset-x-3 lg:inset-x-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 hidden size-[380px] -translate-x-[72%] rounded-full border border-[rgba(100,106,124,0.40)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:border-white/[0.12] sm:block md:size-[440px]"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-8 sm:px-10">
        <span aria-hidden className="absolute left-0 top-0 size-4 border-l border-t border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40" />
        <span aria-hidden className="absolute right-0 top-0 size-4 border-r border-t border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40" />
        <span aria-hidden className="absolute bottom-0 left-0 size-4 border-b border-l border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40" />
        <span aria-hidden className="absolute bottom-0 right-0 size-4 border-b border-r border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40" />

        <div className="flex animate-pulse flex-col items-center">
          <div className="h-3 w-36 rounded bg-border-primary/50" />
          <div className="mt-4 h-[92px] w-[278px] max-w-full rounded bg-border-primary/40 md:h-[59px] md:w-96" />
          <div className="mt-4 h-3.5 w-full max-w-xl rounded bg-border-primary/30" />
          <div className="mt-2 h-3.5 w-4/5 max-w-md rounded bg-border-primary/30" />
        </div>
      </div>
    </div>
  );
}

function ControlsSkeleton() {
  return (
    <div className="mt-14 flex animate-pulse flex-col gap-3 border-y border-border-primary px-2 py-4 motion-reduce:animate-none sm:px-4 lg:flex-row lg:items-center lg:gap-2">
      <div className="order-1 h-8 w-full rounded-lg bg-border-primary/40 lg:order-2 lg:w-64 lg:flex-none" />
      <div className="order-2 flex min-w-0 items-center justify-center gap-1 max-[359px]:gap-0.5 sm:gap-2 lg:order-1 lg:flex-1 lg:justify-start">
        <div className="h-[2rem] w-[35px] rounded-full bg-border-primary/40 sm:w-[50px]" />
        <div className="h-[2rem] w-[49px] rounded-full bg-border-primary/40 sm:w-[67px]" />
        <div className="h-[2rem] w-[105px] rounded-full bg-border-primary/40 sm:w-[131px]" />
        <div className="h-[2rem] w-[35px] rounded-full bg-border-primary/40 sm:w-[50px]" />
        <div className="h-[2rem] w-[58px] rounded-full bg-border-primary/40 sm:w-[74px]" />
      </div>
    </div>
  );
}

export default function ProjectsLoading() {
  return (
    <div className="mt-14 bg-bg-primary">
      <p className="sr-only" role="status">Loading projects</p>
      <div className="px-2 sm:px-4">
        <HeaderSkeleton />
        <ControlsSkeleton />

        <div className="mt-14 space-y-20 xl:hidden">
          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="mt-14 hidden xl:flex xl:gap-6">
          <div className="ml-2 min-w-0 flex-1 space-y-20">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div aria-hidden className="mt-[46.5px] -mb-20 w-px shrink-0 self-stretch bg-border-primary" />
          <div className="mr-2 mt-[213px] min-w-0 flex-1 space-y-20">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
