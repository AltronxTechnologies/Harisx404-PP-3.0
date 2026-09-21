import type { ReactNode } from "react";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { fallbackBuildlogSettings, fetchBuildlogSettings } from "./data";
import type { BuildlogSettings } from "./types";

export default async function BuildlogLayout({ children }: { children: ReactNode }) {
  let settings: BuildlogSettings | null = null;
  try {
    settings = await fetchBuildlogSettings();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      settings = fallbackBuildlogSettings;
    }
  }

  return (
    <div className="relative mt-14">
      {settings ? (
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
            <header className="relative mx-auto max-w-3xl text-center">
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
                {settings.kicker}
              </p>
              <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
                {settings.heading}{" "}
                <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                  {settings.heading_accent}
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
                {settings.description}
              </p>
            </header>
          </div>
        </GridWrapper>
      ) : (
        <h1 className="sr-only">Buildlog</h1>
      )}
      {children}
    </div>
  );
}
