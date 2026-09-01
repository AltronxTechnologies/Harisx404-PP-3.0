import { siteMetadata } from "@/app/data/siteMetadata";
import { BrandGlyph } from "@/app/components/BrandGlyph";

/**
 * The footer's grouped social pill.
 *
 * Previously each of the three links hand-rolled its own inline SVG: the X mark
 * carried `p-[2.5px]` inside a 20px box (so it drew at 15px, 25% smaller than
 * its neighbours), and LinkedIn/GitHub used abstract stroke-outline shapes
 * rather than the real brand marks used everywhere else on the site. All three
 * now render from the shared BrandGlyph at one size, one art style.
 */
const LINKS = [
  { name: "x", href: siteMetadata.twitter, label: "Twitter / X", sr: "Twitter" },
  { name: "linkedin", href: siteMetadata.linkedin, label: "LinkedIn", sr: "LinkedIn" },
  { name: "github", href: siteMetadata.github, label: "GitHub", sr: "GitHub" },
] as const;

export function SocialPill() {
  return (
    <div className="z-30 flex place-items-center space-x-1 rounded-full bg-[#3C3C3F] px-3 py-1.5 shadow-sm dark:bg-white/10">
      {LINKS.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="rounded-full p-1 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <BrandGlyph name={l.name} className="size-5" />
          <span className="sr-only">{l.sr}</span>
        </a>
      ))}
    </div>
  );
}
