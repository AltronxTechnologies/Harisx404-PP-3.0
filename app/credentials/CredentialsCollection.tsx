"use client";

import { ArrowUpRight, CheckCircle2, Link2Off } from "lucide-react";
import type { PublicCredential } from "./data";
import { CredentialImage } from "./CredentialImage";

function CredentialCard({ credential }: { credential: PublicCredential }) {
  const issuerInitial = credential.issuer.trim().charAt(0).toUpperCase() || "C";

  return (
    <article className="flex h-[232px] flex-col rounded-2xl border border-border-primary bg-white p-4 dark:bg-white/[0.02] sm:p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-primary bg-neutral-50 text-base font-medium text-text-secondary dark:bg-white/[0.04]">
          <CredentialImage
            key={credential.issuer_logo_url}
            src={credential.issuer_logo_url}
            fallback={issuerInitial}
            className="absolute inset-2 size-[calc(100%-1rem)] object-contain"
          />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-text-secondary">Issued by</p>
          <p className="mt-1 truncate text-sm font-medium text-text-primary" title={credential.issuer}>{credential.issuer}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${credential.credential_url ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border-primary bg-neutral-50 text-text-secondary dark:bg-white/[0.04]"}`}>
          {credential.credential_url && <CheckCircle2 className="size-3" aria-hidden />}
          {credential.credential_url ? "Verifiable" : "Recorded"}
        </span>
      </div>

      <h3 className="mt-5 line-clamp-2 min-h-12 text-balance [font-family:var(--font-instrument-serif),serif] text-[22px] font-medium leading-6 text-text-primary">
        {credential.title}
      </h3>

      <div className="mt-3 min-h-4">
        {credential.credential_id && (
          <p className="truncate font-mono text-[10px] text-text-secondary" title={credential.credential_id}>
            Credential ID: {credential.credential_id}
          </p>
        )}
      </div>

      <div className="mt-auto flex min-h-12 items-end justify-end border-t border-border-primary pt-3">
        {credential.credential_url ? (
          <a href={credential.credential_url} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-border-primary px-3.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">
            Verify credential
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
            <span className="sr-only">{credential.title} (opens in a new tab)</span>
          </a>
        ) : (
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-dashed border-border-primary px-3.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            <Link2Off className="size-3.5" aria-hidden />
            No verification link
          </span>
        )}
      </div>
    </article>
  );
}

export function CredentialsCollection({ credentials }: { credentials: PublicCredential[] }) {
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {credentials.map((credential) => <CredentialCard key={credential.id} credential={credential} />)}
    </div>
  );
}
