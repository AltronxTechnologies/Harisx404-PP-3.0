"use client";

import { BadgeCheck } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

const collectionTypes = ["Certificates", "Badges", "Achievements"];

export function CredentialBentoPreview({ summary }: { summary: CredentialSummary }) {
  return (
    <div
      data-credential-bento-preview
      data-about-credential-archive
      className="relative grid h-[104px] w-full grid-cols-[1fr_68px] grid-rows-[1fr_25px] overflow-hidden rounded-xl border border-neutral-300 bg-[#f8f7f3] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.75),0_8px_24px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-neutral-400 group-hover:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.9),0_12px_30px_rgba(15,23,42,0.1)] dark:border-white/15 dark:bg-[#121212] dark:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.025),0_8px_24px_rgba(0,0,0,0.2)] dark:group-hover:border-white/25 lg:h-[164px] lg:grid-cols-[1fr_118px] lg:grid-rows-[1fr_34px]"
      aria-label={`${summary.count} published records in the credential archive`}
    >
      <div className="relative flex min-w-0 flex-col justify-center px-3 lg:px-6">
        <span className="font-mono text-[6px] uppercase tracking-[0.22em] text-text-secondary lg:text-[8px]">
          The credential archive
        </span>

        <div className="mt-1 flex items-end gap-2 lg:mt-2 lg:gap-3">
          <span className="font-display text-[34px] font-medium leading-[0.8] tracking-[-0.05em] text-text-primary lg:text-[58px]">
            {String(summary.count).padStart(2, "0")}
          </span>
          <div className="mb-0.5 min-w-0 border-l border-neutral-300 pl-2 dark:border-white/15 lg:mb-1 lg:pl-3">
            <span className="block text-[8px] font-medium leading-tight text-text-primary lg:text-[11px]">
              Documented
            </span>
            <span className="mt-0.5 block font-mono text-[6px] uppercase tracking-[0.14em] text-text-secondary lg:text-[8px]">
              Records
            </span>
          </div>
        </div>

        <span className="absolute bottom-2 left-3 h-px w-8 bg-neutral-300 transition-[width] duration-500 motion-reduce:transition-none group-hover:w-14 dark:bg-white/15 lg:bottom-4 lg:left-6 lg:w-12 lg:group-hover:w-20" />
      </div>

      <div className="relative flex items-center justify-center border-l border-neutral-300 dark:border-white/15">
        <div className="relative flex size-[46px] items-center justify-center rounded-full border border-neutral-400/70 shadow-[inset_0_0_0_3px_#f8f7f3,inset_0_0_0_4px_rgba(115,115,115,0.45)] transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-emerald-700/60 group-hover:shadow-[inset_0_0_0_3px_#f8f7f3,inset_0_0_0_4px_rgba(21,128,61,0.55)] dark:border-white/25 dark:shadow-[inset_0_0_0_3px_#121212,inset_0_0_0_4px_rgba(255,255,255,0.18)] dark:group-hover:border-emerald-300/50 dark:group-hover:shadow-[inset_0_0_0_3px_#121212,inset_0_0_0_4px_rgba(110,231,183,0.4)] lg:size-[78px]">
          <div className="flex size-7 flex-col items-center justify-center rounded-full border border-dashed border-neutral-400/70 lg:size-12">
            <BadgeCheck className="size-3.5 text-emerald-700 dark:text-emerald-300 lg:size-5" strokeWidth={1.6} />
            <span className="mt-0.5 font-mono text-[4px] uppercase tracking-[0.14em] text-text-secondary lg:mt-1 lg:text-[6px]">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-1.5 border-t border-neutral-300 px-2 dark:border-white/15 lg:gap-3 lg:px-4">
        {collectionTypes.map((label, index) => (
          <div key={label} className="contents">
            {index > 0 && <span aria-hidden="true" className="size-0.5 rounded-full bg-neutral-400 dark:bg-white/30" />}
            <span data-credential-ledger-row className="font-mono text-[6px] uppercase tracking-[0.08em] text-text-secondary lg:text-[8px] lg:tracking-[0.14em]">
              {label}
            </span>
          </div>
        ))}
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 size-1.5 border-l border-t border-neutral-400/60 lg:left-3 lg:top-3 lg:size-2" />
      <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 size-1.5 border-r border-t border-neutral-400/60 lg:right-3 lg:top-3 lg:size-2" />
    </div>
  );
}
