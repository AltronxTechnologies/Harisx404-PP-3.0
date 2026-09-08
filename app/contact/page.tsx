import type { Metadata } from "next";
import { ContactClient } from "@/app/components/contact/ContactClient";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteContent } from "@/app/data/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Muhammad Haris about full-time roles, freelance projects, collaborations, and technical opportunities.",
};

export default function ContactPage() {
  const { contact } = siteContent;

  return (
    <div className="relative mt-14">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
              {contact.kicker}
            </p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              {contact.heading}{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                {contact.headingAccent}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              Share the context, goals, and constraints. You will receive a
              thoughtful response, usually within one business day.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-label="Send a message" className="mt-14 px-2 sm:px-4">
        <ContactClient />
      </section>

      <div className="mt-28">
        <CtaSection />
      </div>
    </div>
  );
}
