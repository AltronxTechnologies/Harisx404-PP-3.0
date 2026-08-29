import { HeroTexture } from "@/app/components/HeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { SketchCheckbox } from "@/app/components/buildlog/SketchCheckbox";
import { buildlogProjects } from "@/app/data/buildlog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buildlog | What I Ship",
  description:
    "Per-project buildlogs — shipped features, versions, and upcoming updates for the apps and tools Muhammad Haris builds.",
};

export default function BuildlogPage() {
  return (
    <div className="relative min-w-0 pb-24">
      {/* Decorative hatched side rails — 12px mobile / 32px desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 border-r border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3 border-l border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />

      <HeroTexture />

      {/* Hero — reference structure: mono super-title inside h1 + Instrument
          Serif headline with shimmering gradient accent word */}
      <h1 className="relative z-[2] mx-auto mt-24 mb-14 max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono font-normal text-black/80 text-xs uppercase tracking-widest dark:text-white/70">
          The build never stops
        </p>
        <span className="inline-block text-neutral-900 dark:text-white [font-family:var(--font-instrument-serif),serif]">
          Build. Ship.{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Evolve.
          </span>
        </span>
      </h1>

      {/* Project regions */}
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-12">
        {buildlogProjects.map((project, projectIndex) => (
          <section
            key={project.name}
            className="grid grid-cols-1 border-t border-dashed border-neutral-200 dark:border-neutral-800 lg:grid-cols-12"
          >
            {/* Sticky project header */}
            <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6">
              <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-600">
                {String(projectIndex + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-snug text-neutral-900 dark:text-neutral-100 md:text-3xl">
                {project.name}
              </h2>
              <p className="font-display text-2xl font-bold leading-snug text-neutral-400 dark:text-[#777B84] md:text-3xl">
                {project.tagline}
              </p>
              <p className="mt-3 max-w-[26ch] text-[13px] leading-[1.6] text-neutral-500">
                {project.info}
              </p>
              <span className="mt-3 inline-block shrink-0 whitespace-nowrap rounded-full border border-border-primary bg-black/5 px-3 py-1 font-mono text-[10px] text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                current {project.currentVersion}
              </span>
            </div>

            {/* Checklist rows */}
            <div className="lg:col-span-9 lg:border-l lg:border-dashed lg:border-neutral-200 lg:dark:border-neutral-800">
              {project.items.map((item) => (
                <div
                  key={item.title}
                  className="group/item relative border-b border-neutral-200/50 dark:border-neutral-800/50"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-neutral-900/[0.015] opacity-0 transition-opacity duration-300 group-hover/item:opacity-100 dark:bg-white/[0.015]"
                  />
                  <div className="relative flex items-start gap-4 px-4 py-5 md:px-6">
                    <SketchCheckbox checked={item.done} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3
                        className={`text-base font-medium leading-[22px] tracking-[-0.01em] transition-colors duration-300 ${
                          item.done
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500 group-hover/item:text-neutral-800 dark:group-hover/item:text-neutral-200"
                        }`}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-[13px] leading-[1.6] text-neutral-500">{item.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-border-primary bg-black/5 px-3 py-1 font-mono text-[10px] text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div aria-hidden="true" className="border-t border-dashed border-neutral-200 dark:border-neutral-800" />
      </div>

      {/* Contact CTA — shared section */}
      <div className="relative mt-16">
        <CtaSection />
      </div>
    </div>
  );
}
