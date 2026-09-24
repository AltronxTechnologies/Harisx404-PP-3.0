"use client";

import { BadgeCheck } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

export function CredentialBentoPreview({
  summary,
  revealed = false,
}: {
  summary: CredentialSummary;
  revealed?: boolean;
}) {
  const records = Array.from({ length: 3 }, (_, index) => summary.items[index] ?? null);

  return (
    <div
      data-credential-bento-preview
      data-about-credential-passport
      className={`relative grid h-[104px] w-full grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-xl border bg-neutral-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-neutral-400/60 group-hover:bg-white group-hover:shadow-md group-active:border-neutral-400/60 dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] dark:group-hover:border-white/20 dark:group-hover:bg-white/[0.055] lg:h-[164px] ${revealed ? "border-neutral-400/60 bg-white shadow-md dark:border-white/20 dark:bg-white/[0.055]" : "border-border-primary"}`}
      aria-label={`${summary.count} published credentials in the learning passport`}
    >
      <div className="relative flex min-w-0 flex-col justify-between border-r border-border-primary p-3 lg:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-text-secondary lg:text-[8px]">
            Learning passport
          </span>
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        </div>

        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-emerald-700/30 bg-emerald-50 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.8)] transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none group-hover:border-emerald-700/45 group-hover:bg-emerald-100/70 group-hover:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.85),0_6px_18px_rgba(23,99,63,0.12)] dark:border-emerald-300/25 dark:bg-emerald-400/[0.08] dark:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.025)] dark:group-hover:border-emerald-300/40 dark:group-hover:bg-emerald-400/[0.12] lg:size-16">
            <span className="font-display text-xl font-semibold leading-none text-text-primary lg:text-[28px]">
              {summary.count > 0 ? String(summary.count).padStart(2, "0") : "—"}
            </span>
            <BadgeCheck className="absolute -right-0.5 -top-0.5 size-3.5 text-emerald-700 dark:text-emerald-300 lg:size-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <span className="block font-mono text-[7px] uppercase tracking-[0.15em] text-text-secondary lg:text-[8px]">
              Published
            </span>
            <span className="mt-1 block text-[10px] font-medium leading-tight text-text-primary lg:text-xs">
              Verified evidence
            </span>
          </div>
        </div>

        <span className="h-px w-2/3 bg-border-primary transition-[width] duration-500 motion-reduce:transition-none group-hover:w-full group-active:w-full" />
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1 p-2 lg:gap-2 lg:p-4">
        {records.map((credential, index) => (
          <div
            key={credential?.id ?? `empty-${index}`}
            data-credential-ledger-row
            className="relative flex min-w-0 items-center gap-2 rounded-lg border border-border-primary bg-white/70 px-2 py-0.5 transition-[border-color,background-color] duration-300 motion-reduce:transition-none group-hover:border-emerald-700/20 group-hover:bg-emerald-50/45 group-active:border-emerald-700/20 group-active:bg-emerald-50/45 dark:bg-white/[0.025] dark:group-hover:border-emerald-300/15 dark:group-hover:bg-emerald-300/[0.035] dark:group-active:border-emerald-300/15 dark:group-active:bg-emerald-300/[0.035] lg:px-2.5 lg:py-2"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border-primary font-mono text-[7px] text-text-secondary lg:size-6 lg:text-[8px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <span aria-hidden="true" className={`block truncate font-mono text-[7px] uppercase tracking-[0.12em] text-text-secondary transition-opacity duration-200 group-hover:opacity-0 group-active:opacity-0 lg:text-[8px] ${revealed ? "opacity-0" : "opacity-100"}`}>
                {credential ? "Verified proof" : "Future proof"}
              </span>
              <span className={`absolute inset-0 block truncate text-[9px] font-medium text-text-primary transition-opacity duration-200 group-hover:opacity-100 group-active:opacity-100 lg:text-[10px] ${revealed ? "opacity-100" : "opacity-0"}`}>
                {credential?.issuer || "Open for growth"}
              </span>
            </span>
            <BadgeCheck className={`size-3 shrink-0 ${credential?.credential_url ? "text-emerald-600 dark:text-emerald-300" : "text-neutral-300 dark:text-white/20"}`} strokeWidth={1.8} />
          </div>
        ))}
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute inset-y-2 left-[45%] w-px bg-white/80 shadow-[1px_0_0_rgba(15,23,42,0.04)] dark:bg-white/[0.035] dark:shadow-none" />
    </div>
  );
}
