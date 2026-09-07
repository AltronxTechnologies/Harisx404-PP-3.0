export default function ContactLoading() {
  return (
    <div className="relative mt-14 pb-24" role="status">
      <span className="sr-only">Loading contact page</span>
      <div className="flex animate-pulse flex-col items-center px-4 motion-reduce:animate-none">
        <div className="h-3 w-20 rounded bg-border-primary/50" />
        <div className="mt-4 h-14 w-full max-w-xl rounded bg-border-primary/40 md:h-16" />
        <div className="mt-4 h-4 w-full max-w-lg rounded bg-border-primary/30" />
      </div>
      <div className="mt-14 grid gap-3 px-2 sm:px-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
        <div className="h-[420px] animate-pulse rounded-3xl border border-border-primary bg-border-primary/20 motion-reduce:animate-none" />
        <div className="h-[620px] animate-pulse rounded-3xl border border-border-primary bg-border-primary/20 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
