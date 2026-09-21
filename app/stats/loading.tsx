const pulse = "animate-pulse motion-reduce:animate-none";

function StatSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`min-h-36 rounded-2xl border border-border-primary bg-border-primary/10 p-5 ${className}`}
    >
      <div className={`h-3 w-24 rounded bg-border-primary/45 ${pulse}`} />
      <div className={`mt-5 h-9 w-28 rounded bg-border-primary/35 ${pulse}`} />
      <div className={`mt-3 h-3 w-3/4 rounded bg-border-primary/25 ${pulse}`} />
    </div>
  );
}

export default function StatsLoading() {
  return (
    <div className="mt-14 space-y-12 pb-16 md:mt-16 md:space-y-16">
      <span className="sr-only" role="status">
        Loading site statistics
      </span>
      <div aria-hidden="true">
        <header className="px-4 text-center">
          <div className={`mx-auto h-3 w-24 rounded bg-border-primary/45 ${pulse}`} />
          <div className={`mx-auto mt-4 h-14 w-72 max-w-full rounded bg-border-primary/35 ${pulse}`} />
          <div className={`mx-auto mt-4 h-4 w-96 max-w-full rounded bg-border-primary/25 ${pulse}`} />
        </header>

        {[0, 1, 2].map((section) => (
          <section key={section} className="mt-12 px-4 md:mt-16">
            <div className="mb-8">
              <div className={`h-3 w-28 rounded bg-border-primary/40 ${pulse}`} />
              <div className={`mt-3 h-7 w-48 rounded bg-border-primary/30 ${pulse}`} />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <StatSkeleton className="md:col-span-3" />
              <StatSkeleton className="md:col-span-5" />
              <StatSkeleton className="md:col-span-4" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
