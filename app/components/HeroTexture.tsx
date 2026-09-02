/**
 * Subtle paper-grain hero backdrop for subpages.
 * Our own generated texture: SVG turbulence noise + soft radial glow,
 * masked so it fades out ~500px down the page. Purely decorative.
 */
export function HeroTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden [mask-image:linear-gradient(to_bottom,black,black_55%,transparent)]"
    >
      {/* soft top glow */}
      <div className="absolute left-1/2 top-[-180px] h-[420px] w-[860px] -translate-x-1/2 rounded-full bg-neutral-400/10 blur-3xl dark:bg-white/[0.05]" />
      {/* paper grain */}
      <div
        className="absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.08'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* faint creases */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_42%,rgba(128,128,128,0.05)_43%,transparent_45%),linear-gradient(65deg,transparent_60%,rgba(128,128,128,0.04)_61%,transparent_63%),linear-gradient(150deg,transparent_25%,rgba(128,128,128,0.04)_26%,transparent_28%)]" />
    </div>
  );
}
