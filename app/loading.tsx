const pulse = "animate-pulse motion-reduce:animate-none";

export default function HomeLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading home page</span>
      <div aria-hidden="true">
        <section className="px-2 pb-5 pt-6 sm:px-4 md:pt-7">
          <div className={`grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6 ${pulse}`}>
            <div className="flex flex-col items-center gap-5 md:items-start">
              <div className="space-y-2">
                <div className="h-12 w-48 rounded bg-border-primary/45 sm:h-14 sm:w-56" />
                <div className="h-12 w-36 rounded bg-border-primary/35 sm:h-14 sm:w-44" />
              </div>
              <div className="h-3 w-40 rounded bg-border-primary/40" />
            </div>

            <div className="order-first mx-auto size-[126px] rounded-full border border-border-primary p-3 md:order-none lg:size-[166px]">
              <div className="size-full rounded-full bg-border-primary/40" />
            </div>

            <div className="mx-auto space-y-3 md:mx-0 md:justify-self-end">
              <div className="h-3 w-28 rounded bg-border-primary/40" />
              <div className="h-8 w-52 rounded bg-border-primary/45" />
              <div className="h-3 w-36 rounded bg-border-primary/35" />
            </div>
          </div>

          <div className="-mx-2 mb-5 mt-7 h-px bg-border-primary sm:-mx-4" />

          <div className={`grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-6 ${pulse}`}>
            <div className="mx-auto space-y-3 md:mx-0">
              <div className="h-10 w-64 max-w-full rounded bg-border-primary/45" />
              <div className="h-10 w-52 rounded bg-border-primary/35" />
            </div>
            <div className="h-56 rounded-2xl border border-border-primary bg-border-primary/20 sm:h-64" />
          </div>
        </section>

        <div className={`grid grid-cols-1 border-y border-border-primary md:grid-cols-2 lg:grid-cols-3 ${pulse}`}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="space-y-2 border-b border-border-primary px-6 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="h-2.5 w-24 rounded bg-border-primary/45" />
              <div className="h-4 w-40 rounded bg-border-primary/35" />
            </div>
          ))}
        </div>

        <section className={`px-4 py-28 text-center ${pulse}`}>
          <div className="mx-auto h-3 w-28 rounded bg-border-primary/50" />
          <div className="mx-auto mt-4 h-12 w-80 max-w-full rounded bg-border-primary/40" />
        </section>
      </div>
    </div>
  );
}
