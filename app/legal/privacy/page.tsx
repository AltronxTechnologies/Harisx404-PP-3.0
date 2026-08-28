import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How this personal portfolio site collects, stores, and handles your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative space-y-12 pb-24">
      <div className="pt-14 text-center md:pt-16">
        <GridWrapper>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
            LEGAL
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            Privacy <em className="text-gradient-accent italic">policy</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            A plain-language overview of what this site collects and why.
          </p>
        </GridWrapper>
      </div>

      <GridWrapper>
        <div className="mx-auto max-w-prose space-y-10 px-4 text-text-secondary">
          <p className="rounded-2xl border border-border-primary bg-white p-4 text-sm dark:bg-white/[0.02]">
            Note: this is a template policy for a personal portfolio site and
            should be reviewed by the site owner before being relied upon.
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              What is collected
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-text-primary">
                  Community wall entries
                </span>{" "}
                — if you leave a note, the message, display name, and optional
                avatar you provide are stored so they can be shown publicly on
                the wall.
              </li>
              <li>
                <span className="text-text-primary">Newsletter email</span> —
                if you subscribe, your email address is stored solely to send
                you occasional updates. You can unsubscribe at any time.
              </li>
              <li>
                <span className="text-text-primary">Anonymous analytics</span>{" "}
                — if analytics are enabled, aggregate, non-identifying usage
                data (page views, referrers) may be collected to understand
                what content is useful. No cross-site tracking is performed.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Where it is stored
            </h2>
            <p>
              Data submitted through this site is stored in a Supabase
              (PostgreSQL) database managed by the site owner. Reasonable
              technical measures, including row-level security, are used to
              limit access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              What is never done
            </h2>
            <p>
              Your data is never sold, rented, or shared with third parties for
              marketing purposes. This is a personal portfolio, not an
              advertising business.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-text-primary">
              Deletion &amp; contact
            </h2>
            <p>
              Want a community wall message or your newsletter email removed?
              Reach out through the contact options linked on the homepage and
              it will be deleted promptly. This policy may be updated from time
              to time; the latest version always lives at this URL.
            </p>
          </section>
        </div>
      </GridWrapper>
    </div>
  );
}
