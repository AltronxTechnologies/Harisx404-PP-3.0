/** Shared paper backdrop for subpage heroes. */
export function HeroTexture({ className = "" }: { className?: string }) {
  const placement =
    className || "inset-x-0 top-0 -z-10 h-[520px]";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute overflow-hidden [mask-image:linear-gradient(to_bottom,black,black_55%,transparent)] ${placement}`}
    >
      {/* A seamless fiber tile supplies real paper grain at every viewport. */}
      <div className="absolute inset-0 bg-[url('/textures/paper-fibers.png')] bg-[length:410px_410px] bg-repeat opacity-40 mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-70" />
      {/* Broad folds stop the repeating grain from feeling mechanically flat. */}
      <div className="absolute inset-0 bg-[url('/textures/paper-texture.png')] bg-cover bg-center bg-no-repeat opacity-60 mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-40" />
      {/* Keep the center calm and bright enough for display text. */}
      <div className="absolute left-1/2 top-[-180px] h-[420px] w-[860px] -translate-x-1/2 rounded-full bg-neutral-400/10 blur-3xl dark:bg-white/[0.05]" />
    </div>
  );
}
