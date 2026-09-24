"use client";

import { BadgeCheck } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

const collectionTypes = ["Certificates", "Badges", "Achievements"];

export function CredentialBentoPreview({ summary }: { summary: CredentialSummary }) {
  return (
    <div
      data-credential-bento-preview
      data-about-credential-archive
      className="relative grid h-[104px] w-full grid-cols-[1fr_72px] grid-rows-[1fr_26px] overflow-hidden rounded-xl border border-border-primary bg-neutral-50/80 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.055)] transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none group-hover:bg-white group-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.82),0_9px_26px_rgba(15,23,42,0.07)] group-active:bg-white group-active:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.82),0_9px_26px_rgba(15,23,42,0.07)] dark:border-white/15 dark:bg-[#121212] dark:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.025),0_8px_24px_rgba(0,0,0,0.2)] dark:group-hover:bg-[#151515] dark:group-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.035),0_9px_26px_rgba(0,0,0,0.22)] dark:group-active:bg-[#151515] sm:grid-cols-[1fr_82px] lg:h-[164px] lg:grid-cols-[1fr_118px] lg:grid-rows-[1fr_36px]"
      aria-label={`${summary.count} published records in the credential archive`}
    >
      <div className="relative flex min-w-0 flex-col justify-center px-3 sm:px-4 lg:px-6">
        <span className="font-mono text-[7px] font-medium uppercase tracking-[0.16em] text-text-secondary sm:text-[8px] sm:tracking-[0.18em] lg:text-[9px]">
          The credential archive
        </span>

        <div className="mt-1.5 flex items-end gap-2 sm:gap-2.5 lg:mt-2 lg:gap-3">
          <span className="font-display text-[36px] font-medium leading-[0.8] tracking-[-0.05em] text-neutral-600 dark:text-neutral-300 sm:text-[40px] lg:text-[58px]">
            {String(summary.count).padStart(2, "0")}
          </span>
          <div className="mb-0.5 min-w-0 border-l border-border-primary pl-2 dark:border-white/15 lg:mb-1 lg:pl-3">
            <span className="block text-[9px] font-medium leading-tight text-neutral-600 dark:text-neutral-300 sm:text-[10px] lg:text-xs">
              Documented
            </span>
            <span className="mt-0.5 block font-mono text-[7px] font-medium uppercase tracking-[0.1em] text-text-secondary sm:text-[8px] lg:text-[9px]">
              Records
            </span>
          </div>
        </div>

        <span className="absolute bottom-2 left-3 h-px w-10 bg-border-primary dark:bg-white/15 sm:left-4 sm:w-12 lg:bottom-4 lg:left-6 lg:w-16" />
      </div>

      <div className="relative flex items-center justify-center border-l border-border-primary dark:border-white/15">
        <div className="relative flex size-[48px] items-center justify-center rounded-full border border-neutral-400/60 shadow-[inset_0_0_0_2px_#fafafa,inset_0_0_0_3px_rgba(115,115,115,0.36)] transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none group-hover:border-emerald-700/55 group-hover:shadow-[inset_0_0_0_2px_#ffffff,inset_0_0_0_3px_rgba(21,128,61,0.46)] group-active:border-emerald-700/55 group-active:shadow-[inset_0_0_0_2px_#ffffff,inset_0_0_0_3px_rgba(21,128,61,0.46)] dark:border-white/25 dark:shadow-[inset_0_0_0_2px_#121212,inset_0_0_0_3px_rgba(255,255,255,0.16)] dark:group-hover:border-emerald-300/45 dark:group-hover:shadow-[inset_0_0_0_2px_#151515,inset_0_0_0_3px_rgba(110,231,183,0.34)] dark:group-active:border-emerald-300/45 dark:group-active:shadow-[inset_0_0_0_2px_#151515,inset_0_0_0_3px_rgba(110,231,183,0.34)] sm:size-[52px] lg:size-[78px]">
          <div className="flex size-9 flex-col items-center justify-center rounded-full border border-dashed border-neutral-400/70 sm:size-10 lg:size-[58px]">
            <BadgeCheck className="size-3.5 text-emerald-700 dark:text-emerald-300 sm:size-4 lg:size-5" strokeWidth={1.6} />
            <span className="mt-0.5 font-mono text-[5px] font-medium uppercase leading-none tracking-[0.06em] text-text-secondary sm:text-[6px] lg:mt-1 lg:text-[7px]">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-1.5 border-t border-border-primary px-1.5 dark:border-white/15 sm:gap-2 sm:px-3 lg:gap-3 lg:px-4">
        {collectionTypes.map((label, index) => (
          <div key={label} className="contents">
            {index > 0 && <span aria-hidden="true" className="size-0.5 rounded-full bg-neutral-400 dark:bg-white/30" />}
            <span data-credential-ledger-row className="whitespace-nowrap font-mono text-[7px] font-medium uppercase tracking-[0.03em] text-text-secondary sm:text-[8px] sm:tracking-[0.06em] lg:text-[9px] lg:tracking-[0.1em]">
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
