const pulse = "animate-pulse motion-reduce:animate-none";

export default function BuildlogLoading() {
  return (
    <>
      <span className="sr-only" role="status">Loading Buildlog</span>
      <div aria-hidden="true">
        <section className="mt-14 px-2 sm:px-4">
          <div className="-mx-2 flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:-mx-4 sm:px-8">
            <div className={`h-3 w-32 rounded bg-border-primary/40 ${pulse}`} />
            <div className="flex items-center gap-3">
              <div className={`h-3 w-20 rounded bg-border-primary/30 ${pulse}`} />
              <div className="h-4 w-px bg-border-primary" />
              <div className={`h-3 w-20 rounded bg-border-primary/30 ${pulse}`} />
            </div>
          </div>
          {[0, 1, 2, 3].map((project) => {
            const linkCount = project === 2 ? 1 : 0;
            const plannedCount = project === 3 ? 1 : 2;
            return (
            <div data-loading-project key={project} className="relative grid before:absolute before:-left-2 before:-right-2 before:top-0 before:h-[1.5px] before:bg-neutral-400/60 before:content-[''] dark:before:bg-white/20 sm:before:-left-4 sm:before:-right-4 lg:grid-cols-12">
              <div className="border-b border-border-primary lg:col-span-4 lg:border-b-0 xl:col-span-3">
                <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border-primary px-4 sm:px-6">
                  <div className={`h-3 w-6 rounded bg-border-primary/35 ${pulse}`} />
                  <div className={`h-3 w-20 rounded bg-border-primary/30 ${pulse}`} />
                </div>
                <div className="space-y-3 p-4 lg:p-6">
                  <div className={`h-8 w-3/5 rounded bg-border-primary/45 ${pulse}`} />
                  <div className={`h-6 w-2/5 rounded bg-border-primary/30 ${pulse}`} />
                  <div className={`h-14 w-full rounded bg-border-primary/25 ${pulse}`} />
                  {linkCount > 0 && (
                    <div data-loading-project-links className="grid grid-cols-2 gap-2">
                      {Array.from({ length: linkCount }).map((_, link) => (
                        <div key={link} className={`h-9 rounded-full bg-border-primary/30 ${pulse} ${linkCount === 1 ? "col-span-2" : ""}`} />
                      ))}
                    </div>
                  )}
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
                {Array.from({ length: plannedCount }).map((_, item) => (
                  <div key={item} className="flex h-[104px] items-center gap-4 border-b border-border-primary px-4 min-[430px]:h-24 sm:px-6">
                    <div className={`size-5 shrink-0 rounded-md bg-border-primary/35 ${pulse}`} />
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className={`h-4 w-2/3 rounded bg-border-primary/40 ${pulse}`} />
                        <div className={`h-3 w-4/5 rounded bg-border-primary/25 ${pulse}`} />
                      </div>
                      <div data-loading-release-badge className={`h-[22px] w-14 shrink-0 rounded-full bg-border-primary/30 sm:h-6 sm:w-16 ${pulse}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </section>
        <div data-loading-cta className={`mx-2 mt-28 h-[464px] rounded-3xl bg-border-primary/15 sm:mx-4 md:h-[458px] ${pulse}`} />
      </div>
    </>
  );
}
