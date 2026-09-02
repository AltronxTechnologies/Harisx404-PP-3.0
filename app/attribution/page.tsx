import { HeroTexture } from "@/app/components/HeroTexture";
import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Attribution",
  description:
    "Credits for the design inspiration, open-source tools, and fonts that power this site.",
};

export default function AttributionPage() {
  return (
    <div className="relative space-y-12 pb-24">
      <HeroTexture />
      <div className="pt-14 text-center md:pt-16">
        <GridWrapper>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary">
            ATTRIBUTION
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            Credit where it&apos;s{" "}
            <em className="text-gradient-accent italic">due</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            This site stands on the shoulders of great tools and generous
            communities.
          </p>
        </GridWrapper>
      </div>

      <GridWrapper>
        <div className="mx-auto max-w-prose space-y-10 px-4 text-text-secondary">
          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Design inspiration
            </h2>
            <p>
              The visual language of this site — dark-first palette, serif
              display headings, kicker labels, and bento-style layouts — is
              primarily inspired by the portfolio of{" "}
              <a
                href="https://aayushbharti.in"
                className="text-text-primary underline underline-offset-4 hover:text-text-secondary"
              >
                Aayush Bharti
              </a>
              , whose design work deserves full credit for the patterns echoed
              here. Every word, photo, project, and piece of content on this
              site is original to Muhammad Haris.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Open-source stack
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-text-primary">Next.js</span> — the React
                framework powering routing, server components, and rendering.
              </li>
              <li>
                <span className="text-text-primary">Tailwind CSS</span> —
                utility-first styling with CSS-variable design tokens.
              </li>
              <li>
                <span className="text-text-primary">framer-motion</span> — the
                subtle fades, marquees, and carousels throughout the site.
              </li>
              <li>
                <span className="text-text-primary">Supabase</span> — Postgres
                database, auth, and the backbone of the self-hosted CMS.
              </li>
              <li>
                <span className="text-text-primary">
                  Geist Sans &amp; Geist Mono
                </span>{" "}
                — body and label typography, and{" "}
                <span className="text-text-primary">Instrument Serif</span> for
                display headings.
              </li>
              <li>
                <span className="text-text-primary">Lucide</span> — the icon
                set used across the interface.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Content ownership
            </h2>
            <p>
              All written content, photographs, project descriptions, and other
              media on this site are owned by Muhammad Haris unless explicitly
              stated otherwise. Please don&apos;t reproduce them without
              permission.
            </p>
          </section>
        </div>
      </GridWrapper>
    </div>
  );
}
