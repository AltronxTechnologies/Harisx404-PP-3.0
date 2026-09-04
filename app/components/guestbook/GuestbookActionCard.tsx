"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import useSupabaseClient from "app/lib/supabase/client";
import { ScallopDivider } from "./ScallopDivider";
import { BrandGlyph } from "@/app/components/BrandGlyph";

/** Purple radial banner shared by both states of the action card. */
const BANNER_GRADIENT =
  "radial-gradient(120% 100% at 30% 20%, rgba(88,28,135,0.92), rgba(30,10,60,0.95))";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function GitHubIcon({ className = "size-4" }: { className?: string }) {
  return <BrandGlyph name="github" className={className} />;
}

/** Decorative doodle stickers on the purple banner (traced from reference). */
function BannerDoodles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg className="absolute -top-2 -right-2 size-24 opacity-15" fill="none" stroke="white" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="4" viewBox="0 0 141 149">
        <path d="M 26.981 61.83 L 26.981 74.677 M 44.538 50.696 L 53.103 50.696 M 26.124 33.995 C 27.044 33.88 26.553 28.914 26.553 28 M 3 49.412 L 15.847 49.412 M 18.416 39.562 C 17.65 39.562 15.799 37.754 15.419 36.992 M 39.828 39.562 C 42.301 39.562 42.631 37.946 44.538 36.992 M 39.828 59.69 C 39.954 60.701 43.944 63.889 44.966 64.4 M 15.418 61.402 C 12.318 61.402 11.383 64.062 8.995 65.256" />
      </svg>
      <svg className="absolute bottom-8 left-3 size-10 rotate-12 opacity-15" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 64 64">
        <path d="M 12 52 L 44 8 C 45 6.5 47 6 48.5 7.5 L 50 9 C 51.5 10.5 51 12.5 49.5 14 L 17.5 58" />
        <path d="M 40 12 L 46 18" />
      </svg>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-5 font-medium text-sm text-white backdrop-blur-sm transition-colors hover:border-white/25 active:border-white/25 hover:bg-white/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:opacity-60"
    >
      <PencilIcon />
      {pending ? "Posting..." : "Post it"}
    </button>
  );
}

interface GuestbookActionCardProps {
  user: { name: string; avatarUrl?: string | null } | null;
  action: (formData: FormData) => Promise<void>;
}

/** First grid item — reference "Join the wall..." card. Signed out: GitHub
 *  sign-in prompt. Signed in: inline message composer on the same card. */
export function GuestbookActionCard({ user, action }: GuestbookActionCardProps) {
  const supabase = useSupabaseClient();
  const [signingIn, setSigningIn] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const signIn = () => {
    setSigningIn(true);
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="relative z-20 self-stretch">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        />

        {/* Purple banner */}
        <div
          className="relative flex min-h-44 w-full flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-6 py-6 pb-10 text-center text-white"
          style={{ background: BANNER_GRADIENT }}
        >
          <BannerDoodles />

          {!user ? (
            <>
              <div className="relative z-10">
                <h3 className="text-2xl italic [font-family:var(--font-instrument-serif),serif]">&ldquo;Join the wall...&rdquo;</h3>
                <p className="mt-1 text-xs text-white/50">Sign in to leave your mark</p>
              </div>
              <button
                type="button"
                onClick={signIn}
                disabled={signingIn}
                className="relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-5 font-medium text-sm text-white backdrop-blur-sm transition-colors hover:border-white/25 active:border-white/25 hover:bg-white/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:opacity-60"
              >
                <PencilIcon />
                {signingIn ? "Redirecting..." : "Write a message..."}
              </button>
            </>
          ) : (
            <form ref={formRef} action={action} className="relative z-10 flex w-full flex-col items-center gap-3">
              <h3 className="text-2xl italic [font-family:var(--font-instrument-serif),serif]">&ldquo;Leave your mark&rdquo;</h3>
              {/* Honeypot */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <textarea
                name="message"
                required
                maxLength={200}
                rows={3}
                placeholder="Write a message..."
                className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 backdrop-blur-sm transition-colors hover:border-white/25 active:border-white/25 focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <SubmitButton />
            </form>
          )}
          <ScallopDivider />
        </div>

        {/* Provider footer */}
        <div className="flex items-center justify-center gap-3 px-4 pt-2 pb-3 text-text-secondary">
          {!user ? (
            <GitHubIcon />
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={20} height={20} className="size-5 rounded-full ring-1 ring-neutral-300 dark:ring-neutral-600" />
              ) : (
                <GitHubIcon className="size-4" />
              )}
              <span className="truncate text-xs">Signed in as {user.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
