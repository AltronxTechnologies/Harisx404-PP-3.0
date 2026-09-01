import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

      <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary">
        ERROR
      </p>
      <h1 className="mt-4 font-display text-8xl leading-none text-text-primary md:text-9xl">
        404
      </h1>
      <p className="mt-6 font-display text-2xl text-text-primary md:text-3xl">
        This page wandered{" "}
        <em className="text-gradient-accent italic">off the map</em>
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
        It may have been moved, renamed, or never existed in the first place.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
        >
          Home
        </Link>
        <Link
          href="/blog"
          className="rounded-full border border-border-primary bg-white px-6 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-border-primary/60 dark:bg-white/[0.02]"
        >
          Blog
        </Link>
      </div>
    </div>
  );
}
