"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { DoubleArrow } from "./DoubleArrow";
import { siteContent } from "@/app/data/site-content";
import { BrandGlyph, normaliseBrand } from "@/app/components/BrandGlyph";

const { aboutTeaser } = siteContent;

const socials = aboutTeaser.socials;

function PillIcon({ label }: { label: string }) {
  if (normaliseBrand(label)) return <BrandGlyph name={label} className="size-4" />;
  /* Resume — simple document glyph, stroke inherits currentColor. */
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

/* Wraps configured highlight phrases in <strong> so the key proof
   points pop out of the gray body copy without changing the text. */
function highlightText(text: string, phrases: readonly string[]) {
  if (!phrases.length) return text;
  const pattern = phrases
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "g"));
  return parts.map((part, i) =>
    phrases.includes(part) ? (
      <strong key={i} className="font-medium text-text-primary">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

export function AboutTeaser() {
  const reduced = useReducedMotion();

  const entrance = reduced
    ? {}
    : {
        initial: false,
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.6, ease: "easeOut" as const },
      };

  return (
    <section className="px-2 sm:px-4">
      {/* Centered kicker + heading — identical system to every other
          homepage section (Case Studies, Writings, Testimonials). */}
      <motion.div {...entrance}>
        <SectionHeading kicker={aboutTeaser.kicker}>
          {aboutTeaser.heading}{" "}
          <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
            {aboutTeaser.headingAccent}
          </span>
        </SectionHeading>
      </motion.div>

      {/* Bio card — same card language + inner spacing as the featured blog
          card. Not clickable, so no hover lift (unlike the link cards). */}
      <motion.div
        {...entrance}
        className="mt-14 rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02]"
      >
        <div className="flex flex-col px-2 pb-2 pt-5 sm:px-3 lg:px-5 lg:pt-7">
          <div className="hyphens-auto break-words text-justify text-[15px] font-normal leading-6 text-text-secondary">
            {/* Portrait + both paragraphs. items-stretch makes the image
                span the full height of the text column, and both paragraphs
                share the same left edge beside it. */}
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-8">
              <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-2xl border border-border-primary sm:w-44 md:mx-0 md:aspect-auto md:w-48 md:shrink-0 lg:w-52">
                <Image
                  src="/harisx404.png"
                  alt="Muhammad Haris"
                  fill
                  sizes="(max-width: 768px) 192px, 208px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p>
                  {highlightText(aboutTeaser.paragraphs[0], aboutTeaser.highlights)}
                </p>
                {aboutTeaser.paragraphs.slice(1).map((p) => (
                  <p key={p.slice(0, 24)} className="mt-5">
                    {highlightText(p, aboutTeaser.highlights)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Proof-point strip — three evenly spaced, centered stat blocks. */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border-primary pt-6 sm:gap-8">
              {aboutTeaser.stats.map((stat) => (
                <div key={stat.value} className="text-center">
                  <div className="font-display text-xl font-medium text-text-primary sm:text-2xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-text-secondary sm:text-[11px]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Social pills — icon-only on mobile, icon + label from sm up. */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pb-1">
              {socials.map((social) => {
                const pillClass =
                  "inline-flex items-center gap-2 rounded-full border border-border-primary bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary hover:shadow-md dark:hover:border-white/25 dark:active:border-white/25 dark:bg-white/[0.04] sm:px-5 sm:py-2";
                const inner = (
                  <>
                    <PillIcon label={social.label} />
                    {/* Resume keeps its label on mobile (icon alone is
                        ambiguous); brand icons speak for themselves. */}
                    <span
                      className={
                        social.label === "Resume" ? undefined : "hidden sm:inline"
                      }
                    >
                      {social.label}
                    </span>
                    {social.label !== "Resume" && (
                      <span className="sr-only sm:hidden">{social.label}</span>
                    )}
                  </>
                );
                return social.href.startsWith("/") ? (
                  <Link
                    key={social.label}
                    href={social.href}
                    className={pillClass}
                  >
                    {inner}
                  </Link>
                ) : (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pillClass}
                  >
                    {inner}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section CTA — identical to "Read more posts" / "See more projects". */}
      <motion.div {...entrance} className="mt-16 flex justify-center">
        <Link
          href="/about"
          className="group inline-flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
        >
          More about me
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-primary transition-colors group-hover:border-neutral-400/70 group-active:border-neutral-400/70 dark:group-hover:border-white/25 dark:group-active:border-white/25">
            <DoubleArrow />
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
