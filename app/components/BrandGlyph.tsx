/**
 * Canonical brand glyphs (GitHub / LinkedIn / X).
 *
 * Before this existed the same three marks were drawn by EIGHT independent
 * implementations at six different sizes (`size-3.5` .. `size-7`), in two
 * different art styles (the footer's were stroke-outline while every other
 * copy was a solid fill), with three different GitHub path variants and four
 * naming vocabularies ("X", "X / Twitter", "X (Twitter)", "Twitter").
 *
 * All paths here are solid fills on a 24x24 viewBox and are the single source
 * of truth. Pass `className` to size the glyph; do NOT add padding to
 * individual glyphs to fake optical sizing - that is what made the footer's X
 * render 25% smaller than its neighbours.
 */

export type BrandName = "github" | "linkedin" | "x";

/** Normalises the many historical spellings onto one key. */
export function normaliseBrand(label: string): BrandName | null {
  const k = label.trim().toLowerCase();
  if (k === "github") return "github";
  if (k === "linkedin") return "linkedin";
  if (
    k === "x" ||
    k === "twitter" ||
    k === "x / twitter" ||
    k === "x (twitter)" ||
    k === "twitter / x" ||
    k === "x-twitter"
  ) {
    return "x";
  }
  return null;
}

const PATHS: Record<BrandName, string> = {
  github:
    "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
  linkedin:
    "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
};

export function BrandGlyph({
  name,
  className = "size-6",
}: {
  /** Accepts any historical spelling; unknown names fall back to GitHub. */
  name: string;
  className?: string;
}) {
  const key = normaliseBrand(name) ?? "github";
  return (
    <svg
      className={`${className} fill-current`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={PATHS[key]} />
    </svg>
  );
}
