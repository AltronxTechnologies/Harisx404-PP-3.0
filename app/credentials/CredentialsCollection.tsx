"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronDown, Plus } from "lucide-react";
import type { CertificationRow } from "@/app/lib/utils";
import { CredentialImage } from "./CredentialImage";

function CredentialCard({ credential }: { credential: CertificationRow }) {
  const [expanded, setExpanded] = useState(false);
  const issuerInitial = credential.issuer.trim().charAt(0).toUpperCase() || "C";
  const hasDetails = Boolean(
    credential.description || credential.credential_id || credential.skills.length > 2,
  );

  return (
    <article className="rounded-2xl border border-border-primary bg-white p-4 dark:bg-white/[0.02] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-primary bg-neutral-50 text-base font-medium text-text-secondary dark:bg-white/[0.04]">
          {issuerInitial}
          <CredentialImage src={credential.issuer_logo_url} className="absolute inset-2 size-[calc(100%-1rem)] object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-text-primary" title={credential.issuer}>{credential.issuer}</p>
            {credential.is_demo && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-amber-700 dark:text-amber-300">Demo</span>}
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-text-secondary">{credential.category}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-3" aria-hidden />
          {credential.credential_url ? "Verifiable" : "Recorded"}
        </span>
      </div>

      <h2 className="mt-4 min-h-12 text-balance [font-family:var(--font-instrument-serif),serif] text-[22px] font-medium leading-6 text-text-primary">
        {credential.title}
      </h2>

      {credential.skills.length > 0 && (
        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5">
          {credential.skills.slice(0, 2).map((skill) => (
            <span key={skill} className="rounded-full border border-border-primary px-2.5 py-1 font-mono text-[8px] uppercase tracking-widest text-text-secondary">{skill}</span>
          ))}
          {credential.skills.length > 2 && (
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={`credential-details-${credential.id}`} className="inline-flex min-h-7 items-center gap-1 rounded-full border border-dashed border-border-primary px-2.5 font-mono text-[8px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
              <Plus className={`size-3 transition-transform ${expanded ? "rotate-45" : ""}`} aria-hidden />
              {credential.skills.length - 2} more
            </button>
          )}
        </div>
      )}

      {expanded && hasDetails && (
        <div id={`credential-details-${credential.id}`} className="mt-4 border-t border-border-primary pt-4">
          {credential.description && <p className="text-sm leading-5 text-text-secondary">{credential.description}</p>}
          {credential.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {credential.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-border-primary px-2.5 py-1 font-mono text-[8px] uppercase tracking-widest text-text-secondary">{skill}</span>
              ))}
            </div>
          )}
          {credential.credential_id && <p className="mt-4 break-all font-mono text-[9px] text-text-secondary">Credential ID: {credential.credential_id}</p>}
        </div>
      )}

      <div className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-border-primary pt-3">
        {hasDetails ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={`credential-details-${credential.id}`} className="inline-flex min-h-9 items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
            {expanded ? "Hide details" : "Details"}
            <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        ) : <span />}

        {credential.credential_url ? (
          <a href={credential.credential_url} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-border-primary px-3.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">
            Verify credential
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
            <span className="sr-only">{credential.title} (opens in a new tab)</span>
          </a>
        ) : (
          <span className="font-mono text-[8px] uppercase tracking-widest text-text-secondary">Verification unavailable</span>
        )}
      </div>
    </article>
  );
}

export function CredentialsCollection({ credentials }: { credentials: CertificationRow[] }) {
  return (
    <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      {credentials.map((credential) => <CredentialCard key={credential.id} credential={credential} />)}
    </div>
  );
}
