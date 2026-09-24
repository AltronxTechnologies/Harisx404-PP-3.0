"use client";

import { Award, BadgeCheck, FileCheck2, Trophy } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

const collectionTypes = [
  { label: "Certificates", icon: FileCheck2 },
  { label: "Badges", icon: Award },
  { label: "Achievements", icon: Trophy },
];

export function CredentialBentoPreview({ summary }: { summary: CredentialSummary }) {

  return (
    <div
      data-credential-bento-preview
      data-about-credential-archive
      className="relative grid h-[104px] w-full grid-cols-[0.65fr_1.35fr] overflow-hidden rounded-xl border border-border-primary bg-neutral-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-neutral-400/60 group-hover:bg-white group-hover:shadow-md group-active:border-neutral-400/60 dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] dark:group-hover:border-white/20 dark:group-hover:bg-white/[0.055] lg:h-[164px] lg:grid-cols-[0.82fr_1.18fr]"
      aria-label={`${summary.count} published records in the credential archive`}
    >
      <div className="relative flex min-w-0 flex-col justify-between border-r border-border-primary p-3 lg:p-4">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-text-secondary lg:text-[8px]">
            Archive
          </span>
        </div>

        <div>
          <span className="font-display text-[32px] font-semibold leading-none tracking-tight text-text-primary lg:text-5xl">
            {String(summary.count).padStart(2, "0")}
          </span>
          <span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.15em] text-text-secondary lg:mt-2 lg:text-[8px]">
            Published records
          </span>
        </div>

        <div className="flex items-center gap-1 text-[8px] font-medium text-text-secondary lg:text-[9px]">
          <BadgeCheck className="size-3 text-emerald-600 dark:text-emerald-300" strokeWidth={1.8} />
          <span>Evidence indexed</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1 p-2 lg:gap-2 lg:p-4">
        {collectionTypes.map(({ label, icon: Icon }, index) => (
          <div
            key={label}
            data-credential-ledger-row
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border-primary bg-white/70 px-2 py-0.5 transition-[border-color,background-color] duration-300 motion-reduce:transition-none group-hover:border-neutral-400/50 group-hover:bg-white group-active:border-neutral-400/50 dark:bg-white/[0.025] dark:group-hover:border-white/15 dark:group-hover:bg-white/[0.045] lg:px-2.5 lg:py-2"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border-primary bg-neutral-50 text-text-secondary dark:bg-white/[0.03] lg:size-6">
              <Icon className="size-2.5 lg:size-3" strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-text-primary lg:text-[10px]">
              {label}
            </span>
            <span className="font-mono text-[7px] text-text-secondary lg:text-[8px]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute inset-y-3 left-[32.5%] w-px bg-white/80 shadow-[1px_0_0_rgba(15,23,42,0.04)] dark:bg-white/[0.035] dark:shadow-none lg:left-[41%]" />
    </div>
  );
}
