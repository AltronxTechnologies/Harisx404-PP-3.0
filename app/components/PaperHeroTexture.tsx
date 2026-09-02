/**
 * Theme-aware paper surface for feature heroes. The source image stays local;
 * blend modes remove its white base while retaining the physical folds.
 */
export function PaperHeroTexture({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] ${className}`}
    >
      <div className="absolute inset-0 bg-[url('/textures/Paper-texture-harisx404.jpg')] bg-cover bg-center bg-no-repeat opacity-100 mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-85" />
    </div>
  );
}
