import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Simple terms of use for this personal portfolio website.",
};

export default function TermsPage() {
  return (
    <div className="relative space-y-12 pb-24">
      <div className="pt-14 text-center md:pt-16">
        <GridWrapper>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
            LEGAL
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            Terms of <em className="text-gradient-accent italic">use</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Short, simple, and hopefully unsurprising.
          </p>
        </GridWrapper>
      </div>

      <GridWrapper>
        <div className="mx-auto max-w-prose space-y-10 px-4 text-text-secondary">
          <p className="rounded-2xl border border-border-primary bg-white p-4 text-sm dark:bg-white/[0.02]">
            Note: this is a template for a personal portfolio site and should
            be reviewed by the site owner before being relied upon.
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Content ownership
            </h2>
            <p>
              All articles, project write-ups, images, and other original
              content on this site are owned by Muhammad Haris unless stated
              otherwise. You may link to and quote brief excerpts with
              attribution, but please do not republish full content without
              permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              No warranty
            </h2>
            <p>
              Everything here — articles, code snippets, opinions — is provided
              &quot;as is&quot; without warranty of any kind. Use anything you
              learn or copy at your own risk; nothing on this site constitutes
              professional advice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              External links
            </h2>
            <p>
              This site links out to third-party websites and services. Those
              destinations are not under the site owner&apos;s control, and no
              responsibility is taken for their content, policies, or
              availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Changes
            </h2>
            <p>
              These terms may be updated occasionally. Continued use of the
              site after changes means you accept the updated terms.
            </p>
          </section>
        </div>
      </GridWrapper>
    </div>
  );
}
