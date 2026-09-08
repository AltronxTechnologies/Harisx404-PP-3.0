import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";

const pulse = "animate-pulse motion-reduce:animate-none";

function CredentialSkeleton() {
  return (
    <div className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02]">
      <div className={`aspect-[16/9] rounded-2xl bg-border-primary/30 ${pulse}`} />
      <div className="px-3 pb-3 pt-5">
        <div className={`h-10 w-3/5 rounded bg-border-primary/30 ${pulse}`} />
        <div className={`mt-5 h-7 w-4/5 rounded bg-border-primary/40 ${pulse}`} />
        <div className={`mt-3 h-16 w-full rounded bg-border-primary/20 ${pulse}`} />
        <div className={`mt-5 h-16 w-full rounded bg-border-primary/20 ${pulse}`} />
        <div className={`mt-5 h-9 w-28 rounded-full bg-border-primary/30 ${pulse}`} />
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
                <span className="invisible">Certifications, validated skills, and professional learning milestones managed directly through this portfolio.</span>
                <span className="absolute inset-0 rounded bg-border-primary/30" />
              </div>
            </div>
          </div>
        </GridWrapper>
        <div className="mt-14 px-2 sm:px-4">
          <div className={`mb-6 h-[78px] border-y border-border-primary bg-border-primary/10 ${pulse}`} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <CredentialSkeleton /><CredentialSkeleton /><CredentialSkeleton />
          </div>
        </div>
        <div className={`mx-2 mt-28 h-[464px] rounded-3xl bg-border-primary/15 sm:mx-4 md:h-[458px] ${pulse}`} />
      </div>
    </div>
  );
}
