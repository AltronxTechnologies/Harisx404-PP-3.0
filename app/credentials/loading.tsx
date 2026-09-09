import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

function CredentialSkeleton() {
  return (
    <div className="h-[232px] rounded-2xl border border-border-primary bg-white p-4 dark:bg-white/[0.02] sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`size-12 shrink-0 rounded-xl bg-border-primary/30 ${pulse}`} />
        <div className="flex-1">
          <div className={`h-4 w-2/5 rounded bg-border-primary/40 ${pulse}`} />
          <div className={`mt-2 h-3 w-1/4 rounded bg-border-primary/30 ${pulse}`} />
        </div>
      </div>
      <div className={`mt-5 h-12 w-4/5 rounded bg-border-primary/40 ${pulse}`} />
      <div className="mt-7 flex items-center justify-end border-t border-border-primary pt-3">
        <div className={`h-9 w-32 rounded-full bg-border-primary/30 ${pulse}`} />
      </div>
    </div>
  );
}

export default function CredentialsLoading() {
  return (
    <div className="relative mt-14">
      <span className="sr-only" role="status">Loading credentials</span>
      <div aria-hidden="true">
        <GridWrapper>
          <div className="relative px-4 xl:px-0">
            <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
            <div className={`relative mx-auto flex max-w-3xl flex-col items-center text-center ${pulse}`}>
              <div className="h-4 w-28 rounded bg-border-primary/50" />
              <div className="relative mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight md:text-[56px] md:tracking-[-1.5px]">
                <span className="invisible">Evidence behind the <span className="px-1 pb-1 italic">expertise.</span></span>
                <span className="absolute inset-0 rounded bg-border-primary/40" />
              </div>
              <div className="relative mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6">
                <span className="invisible">Certifications and learning milestones across programming, full-stack engineering, cybersecurity, networking, and AI.</span>
                <span className="absolute inset-0 rounded bg-border-primary/30" />
              </div>
            </div>
          </div>
        </GridWrapper>
        <div className="mt-14 px-2 sm:px-4">
          <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <div className={`h-3 w-36 rounded bg-border-primary/40 ${pulse}`} />
              <div className={`mt-2 h-4 w-72 max-w-full rounded bg-border-primary/25 ${pulse}`} />
            </div>
            <div className={`h-3 w-32 rounded bg-border-primary/30 ${pulse}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <CredentialSkeleton /><CredentialSkeleton /><CredentialSkeleton />
            <CredentialSkeleton /><CredentialSkeleton /><CredentialSkeleton />
          </div>
        </div>
        <div className={`mx-2 mt-28 h-[464px] rounded-3xl bg-border-primary/15 sm:mx-4 md:h-[458px] ${pulse}`} />
      </div>
    </div>
  );
}
