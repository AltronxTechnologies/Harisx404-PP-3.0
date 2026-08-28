/* LOCKED PAGE — audited & production-approved. Do not change layout,
   typography, spacing, or behavior without explicit owner approval. */
import type { Metadata } from "next";
import { HorizontalLine } from "@/app/components/HorizontalLine";
import React from "react";
import { ScrapbookBento } from "@/app/components/ScrapbookBento";
import { ShadowBox } from "@/app/components/ShadowBox";
import { Resume } from "app/components/Resume";
import { StatsBento } from "@/app/components/StatsBento";
import { GridWrapper } from "@/app/components/GridWrapper";
import { BsitCard, KpitbCard } from "../components/EducationCards";
import { AboutTrackPattern } from "@/app/components/AboutTrackPattern";
import { EduReveal, EduCardHover } from "@/app/components/EducationMotion";
import { SectionHeading } from "@/app/components/home/SectionHeading";
import { CtaSection } from "@/app/components/home/CtaSection";
import { AccountsBento, SiteStatsBento } from "@/app/components/home/HomeBento";
import {
  fetchExperiences,
  fetchProjects,
  fetchAndSortBlogPosts,
  fetchTestimonials,
} from "@/app/lib/utils";
import { getServerStats } from "@/app/lib/stats/server-stats";
import { getBuildTimeStats } from "@/app/lib/stats/build-time-stats";

export const revalidate = 3600; // Cache for 1 hour, revalidated on demand via admin panel

export const metadata: Metadata = {
  title: "About",
  description:
    "Muhammad Haris — full-stack engineer working across web development, cybersecurity, and AI/ML.",
};


export default async function AboutPage() {
  const [dbExperiences, dbProjects, dbPosts, dbTestimonials, serverStats, buildStats] =
    await Promise.all([
      fetchExperiences(),
      fetchProjects(),
      fetchAndSortBlogPosts(),
      fetchTestimonials(),
      getServerStats().catch(() => null),
      getBuildTimeStats().catch(() => null),
    ]);

  /* Same live counters as the homepage "Shipped, counted, public" card. */
  const siteStats = {
    projects: dbProjects.length > 0 ? dbProjects.length : null,
    posts: buildStats?.totalArticles ?? (dbPosts.length > 0 ? dbPosts.length : null),
    notes: serverStats?.communityWallMessages ?? null,
    testimonials: dbTestimonials.length > 0 ? dbTestimonials.length : null,
    views: serverStats?.totalViews ?? null,
  };

  // SITE STANDARD (locked): every page except home uses mt-14 (56px)
  // as its page top margin. Home keeps its own hero spacing.
  return (
    <div className="relative mt-14">
      <div className="relative space-y-28">
        {/* Hero — kicker + heading + intro (same system as homepage sections) */}
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            {/* Engineering dot-grid — from the very top of the screen to the
                end of this About-me section. Lighter dots, soft bottom fade.
                (Previous option: paper texture at /textures/paper-texture.png) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-2 bottom-0 top-[-128px] [background-image:radial-gradient(circle,rgba(100,106,124,0.30)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_1px)] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0"
            />
            <div className="relative">
            <h1 className="sr-only">
              About Muhammad Haris — Full-Stack Developer, Cybersecurity &amp;
              AI
            </h1>
            <SectionHeading kicker="About me" className="mx-auto max-w-2xl">
              {"Developing modern solutions across "}
              <span className="text-gradient-animated font-display italic">
                web, security &amp; AI.
              </span>
            </SectionHeading>
            <div className="mx-auto mt-14 max-w-3xl space-y-5 hyphens-auto break-words text-justify text-pretty text-sm leading-relaxed text-text-secondary lg:max-w-5xl xl:max-w-6xl">
              <p>
                I&apos;m{" "}
                <strong className="font-medium text-text-primary">
                  Muhammad Haris
                </strong>
                , a BSIT graduate (2022&ndash;2026) from the University of
                Malakand with a strong foundation in{" "}
                <strong className="font-medium text-text-primary">
                  Cybersecurity, Network Security, and Full-Stack Web
                  Development
                </strong>
                . I ranked in the{" "}
                <strong className="font-medium text-text-primary">
                  Top 15%
                </strong>{" "}
                nationally in Pakistan&apos;s NSCT 2026 among{" "}
                <strong className="font-medium text-text-primary">
                  33,000+
                </strong>{" "}
                candidates, achieved{" "}
                <strong className="font-medium text-text-primary">96%</strong>{" "}
                in Cybersecurity coursework, and am{" "}
                <strong className="font-medium text-text-primary">
                  KPITB AI/ML certified
                </strong>
                .
              </p>
              <p>
                From developing full-stack applications to exploring security
                operations and applied AI, I enjoy working across disciplines
                to solve complex problems and turn ideas into reliable,
                secure, and intelligent solutions.
              </p>
            </div>
            </div>
          </div>
        </GridWrapper>

        <span className="absolute left-1/2 top-40 -translate-y-1/2 translate-x-1/2">
          <HorizontalLine />
        </span>

        {/* Experience */}
        <div className="relative space-y-14 text-center">
          <GridWrapper>
            <div className="px-4 xl:px-0">
              <SectionHeading kicker="Experience" className="mx-auto max-w-2xl">
                {"A timeline of my professional experience and "}
                <span className="text-gradient-animated font-display italic">
                  technical journey.
                </span>
              </SectionHeading>
            </div>
          </GridWrapper>
          <GridWrapper className="text-left">
            <Resume experiences={dbExperiences} />
          </GridWrapper>
        </div>

        {/* Education */}
        <div className="relative space-y-14 text-center">
          <GridWrapper>
            <div className="px-4 xl:px-0">
              <SectionHeading kicker="Education" className="mx-auto max-w-2xl">
                {"My academic journey and the "}
                <span className="text-gradient-animated font-display italic">
                  milestones behind it.
                </span>
              </SectionHeading>
            </div>
          </GridWrapper>
          <div className="relative -mx-2 h-fit overflow-hidden border-y border-gray-300 px-6 dark:border-white/20 sm:-mx-3 sm:px-7 lg:mx-0 lg:w-full lg:px-0">
            <div className="absolute left-0 top-0 w-full md:left-4 lg:left-[345px] xl:left-[445px]">
              <AboutTrackPattern />
            </div>

            {/* Section 1 — BSIT */}
            <EduReveal>
            <div className="grid grid-cols-1 gap-8 pb-12 pt-16 lg:grid-cols-2 lg:items-center lg:justify-between lg:pb-[84px] lg:pt-32 lg:pr-12">
              <div className="flex flex-col items-center text-left lg:order-2 lg:items-start">
                <div className="mb-8 text-center lg:hidden">
                  <EduCardHover>
                    <ShadowBox width={188} height={278}></ShadowBox>
                    <BsitCard />
                  </EduCardHover>
                </div>
                <p className="mb-3 w-full lg:max-w-xl font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                  2022 — 2026 · University of Malakand
                </p>
                <h2 className="mb-4 w-full lg:max-w-xl text-balance font-org text-[22px] font-semibold leading-tight tracking-tight text-text-primary">
                  B.S. in Information Technology
                </h2>
                <p className="mb-6 w-full lg:max-w-xl break-words text-sm leading-relaxed text-text-secondary">
                  I completed my Bachelor of Science in Information
                  Technology at the University of Malakand (2022 — 2026),
                  graduated with a 3.5/4.0 CGPA and a strong foundation in
                  software engineering, full-stack web development, database
                  systems, computer networks, cybersecurity, artificial
                  intelligence, and IoT. Along the way I built practical
                  expertise in C++, Python, JavaScript, and the MERN
                  stack — and served as Lead Developer of TourMate Malakand,
                  my full-stack MERN Final Year Project.
                </p>
              </div>
              <div className="hidden lg:order-1 lg:block">
                <EduCardHover>
                  <ShadowBox width={188} height={278}></ShadowBox>
                  <BsitCard />
                </EduCardHover>
              </div>
            </div>
            </EduReveal>

            {/* Small-screen divider between the two panels */}
            <div className="h-px w-full bg-gray-200 dark:bg-white/10 lg:hidden" />

            {/* Section 2 — KPITB AI/ML, present */}
            <EduReveal>
            <div className="grid grid-cols-1 gap-8 pb-16 pt-12 lg:grid-cols-2 lg:items-center lg:justify-between lg:pb-32 lg:pt-[84px] lg:pl-12">
              <div className="flex flex-col items-center text-left lg:items-start">
                <div className="mb-8 text-center lg:hidden">
                  <EduCardHover>
                    <ShadowBox width={188} height={278}></ShadowBox>
                    <KpitbCard />
                  </EduCardHover>
                </div>
                <p className="mb-3 w-full lg:max-w-xl font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                  KPITB · University of Malakand
                </p>
                <h2 className="mb-4 w-full lg:max-w-xl text-balance font-org text-[22px] font-semibold leading-tight tracking-tight text-text-primary">
                  KPITB AI/ML Training Program
                </h2>
                <p className="mb-6 w-full lg:max-w-xl break-words text-sm leading-relaxed text-text-secondary">
                  I completed a hands-on AI/ML training program offered by
                  KPITB at the University of Malakand, focused on practical
                  Artificial Intelligence and Machine Learning development.
                  The program covered Machine Learning, Deep Learning, Neural
                  Networks, and Generative AI — from data analysis and model
                  development to evaluation — through project-based work on
                  modern AI applications.
                </p>
              </div>
              <div className="hidden lg:block">
                <EduCardHover>
                  <ShadowBox width={188} height={278}></ShadowBox>
                  <KpitbCard />
                </EduCardHover>
              </div>
            </div>
            </EduReveal>
          </div>
        </div>

        {/* More */}
        <section className="relative space-y-14">
          <GridWrapper>
            <SectionHeading kicker="Beyond the resume" className="mx-auto max-w-2xl">
              One handle, live numbers &amp; the{" "}
              <span className="text-gradient-animated font-display italic">
                story behind the work
              </span>
            </SectionHeading>
          </GridWrapper>

          {/* About Grid */}
          <GridWrapper>
            <div className="grid grid-cols-1 gap-2 px-2 sm:px-4 lg:grid-cols-12">
              {/* Left stack (5) — mirrors homepage: Accounts (220) + Stats (300) */}
              <div className="flex flex-col gap-2 lg:col-span-5">
                <AccountsBento />
                <StatsBento height="h-[220px] lg:h-[300px]" />
              </div>
              {/* Right stack (7) — mirrors homepage: Scrapbook (300) + Site stats (220) */}
              <div className="flex flex-col gap-2 lg:col-span-7">
                <ScrapbookBento />
                <SiteStatsBento site={siteStats} />
              </div>
            </div>
          </GridWrapper>
        </section>

        {/* CTA — same as homepage */}
        <CtaSection />
      </div>
    </div>
  );
}
