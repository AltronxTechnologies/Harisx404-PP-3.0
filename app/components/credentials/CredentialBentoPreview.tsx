"use client";

import { CheckCircle2 } from "lucide-react";
import type { CredentialSummary } from "@/app/credentials/summary";

export function CredentialBentoPreview({ summary }: { summary: CredentialSummary }) {
  if (summary.items.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border-primary font-mono text-[10px] uppercase tracking-widest text-text-secondary">
        Credential collection in progress
      </div>
    );
  }

  return (
    <div data-credential-bento-preview className="grid h-28 grid-cols-3 gap-2" aria-hidden="true">
      {summary.items.map((credential) => (
        <div key={credential.id} className="relative flex min-w-0 flex-col items-center justify-center rounded-xl border border-border-primary bg-neutral-50/70 px-2 text-center dark:bg-white/[0.04]">
          <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg border border-border-primary bg-white text-xs font-semibold text-text-secondary dark:bg-white/[0.05]">
            {credential.issuer.trim().charAt(0).toUpperCase() || "C"}
          </span>
          <span className="mt-2 w-full truncate font-mono text-[9px] uppercase tracking-wide text-text-secondary">
            {credential.issuer}
          </span>
          {credential.credential_url && (
            <CheckCircle2 className="absolute right-1.5 top-1.5 size-3 text-emerald-500" />
          )}
        </div>
      ))}
    </div>
  );
}
