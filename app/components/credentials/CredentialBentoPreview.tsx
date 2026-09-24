"use client";

import { Award, BadgeCheck, FileCheck2, Trophy } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

const collectionTypes = [
  { label: "Certificates", shortLabel: "Cert", icon: FileCheck2 },
  { label: "Badges", shortLabel: "Badge", icon: Award },
  { label: "Achievements", shortLabel: "Award", icon: Trophy },
];

export function CredentialBentoPreview({ summary }: { summary: CredentialSummary }) {
  return (
    <div
      data-credential-bento-preview
      data-about-credential-archive
      className="relative grid h-[104px] w-full grid-cols-[1.18fr_0.82fr] overflow-hidden rounded-xl border border-border-primary bg-neutral-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-neutral-400/60 group-hover:bg-white group-hover:shadow-md group-active:border-neutral-400/60 dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] dark:group-hover:border-white/20 dark:group-hover:bg-white/[0.055] lg:h-[164px] lg:grid-cols-[1.08fr_0.92fr]"
      aria-label={`${summary.count} published records in the credential archive`}
    >
      <div className="relative min-w-0 overflow-hidden border-r border-border-primary">
        <div aria-hidden="true" className="absolute inset-x-5 bottom-2 top-5 rounded-lg border border-border-primary/60 bg-neutral-100/80 dark:bg-white/[0.025] lg:inset-x-8 lg:bottom-4 lg:top-8" />
        <div aria-hidden="true" className="absolute inset-x-3.5 bottom-3.5 top-3.5 rounded-lg border border-border-primary/80 bg-neutral-50 shadow-sm dark:bg-white/[0.035] lg:inset-x-6 lg:bottom-6 lg:top-6" />

        <div className="absolute inset-x-2 bottom-5 top-2 flex flex-col rounded-lg border border-neutral-300 bg-white px-2 py-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-neutral-400 group-hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-neutral-950 dark:shadow-[0_6px_18px_rgba(0,0,0,0.24)] dark:group-hover:border-white/25 lg:inset-x-4 lg:bottom-9 lg:top-4 lg:px-3 lg:py-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-1 lg:pb-2">
            <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-text-secondary lg:text-[8px]">
              Credential folio
            </span>
            <BadgeCheck className="size-3 shrink-0 text-emerald-600 dark:text-emerald-300 lg:size-4" strokeWidth={1.8} />
          </div>

          <div className="mt-1 grid flex-1 grid-cols-3 gap-1 lg:mt-2 lg:gap-2">
            {collectionTypes.map(({ label, shortLabel, icon: Icon }) => (
              <div
                key={label}
                data-credential-ledger-row
                aria-label={label}
                className="flex min-w-0 flex-col items-center justify-center rounded-md border border-border-primary bg-neutral-50/80 px-0.5 text-center dark:bg-white/[0.025]"
              >
                <Icon className="size-2.5 text-text-secondary lg:size-3.5" strokeWidth={1.6} />
                <span className="mt-0.5 font-mono text-[5px] uppercase tracking-[0.04em] text-text-secondary lg:mt-1 lg:text-[7px]">
                  {shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex min-w-0 flex-col justify-between p-2.5 lg:p-5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-text-secondary lg:text-[8px]">
            Collection
          </span>
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        </div>

        <div>
          <div className="flex items-end gap-1">
            <span className="font-display text-[32px] font-semibold leading-none tracking-tight text-text-primary lg:text-[52px]">
              {String(summary.count).padStart(2, "0")}
            </span>
            <span className="mb-0.5 font-mono text-[6px] uppercase tracking-wider text-text-secondary lg:mb-1 lg:text-[8px]">
              Records
            </span>
          </div>
          <span className="mt-1 block text-[8px] font-medium text-text-primary lg:mt-2 lg:text-[10px]">
            Verified archive
          </span>
        </div>

        <div className="flex items-center gap-1 border-t border-dashed border-border-primary pt-1.5 font-mono text-[6px] uppercase tracking-[0.1em] text-text-secondary lg:pt-2 lg:text-[8px]">
          <span>Index</span>
          <span className="h-px flex-1 bg-border-primary" />
          <span>{String(summary.count).padStart(3, "0")}</span>
        </div>
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute left-[59%] top-2 size-1 border-l border-t border-neutral-400/60 lg:left-[54%] lg:top-3" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 size-1 border-b border-r border-neutral-400/60 lg:bottom-3 lg:right-3" />
    </div>
  );
}
