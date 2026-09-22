"use client";

import * as React from "react";
import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, PenLine } from "lucide-react";
import type { CommunityWallActionState } from "@/app/community-wall/actions";
import { ScallopDivider } from "./ScallopDivider";
import { BrandGlyph } from "@/app/components/BrandGlyph";

const useActionStateCompat: typeof useFormState =
  (React as unknown as { useActionState?: typeof useFormState }).useActionState ?? useFormState;

const initialState: CommunityWallActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <PenLine aria-hidden="true" className="size-4" />}
      {pending ? "Submitting..." : "Submit note"}
    </button>
  );
}

type Props = {
  user: { name: string; avatarUrl?: string | null } | null;
  action: (
    previous: CommunityWallActionState,
    formData: FormData,
  ) => Promise<CommunityWallActionState>;
  authError?: boolean;
  copy: {
    signInTitle: string;
    signInDescription: string;
    composerTitle: string;
    composerDescription: string;
  };
};

export function GuestbookActionCard({ user, action, copy, authError = false }: Props) {
  const [length, setLength] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionStateCompat(action, initialState);

  React.useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setLength(0);
    }
  }, [state]);

  return (
    <article className="relative flex min-h-[286px] flex-col overflow-hidden rounded-2xl border border-border-primary bg-bg-primary shadow-sm">
      <div className="relative flex min-h-[226px] flex-1 flex-col items-center justify-center overflow-hidden bg-[#30134f] px-5 py-6 text-center text-white dark:bg-[#25103d]">
        <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_24%_18%,white_0,transparent_38%)]" />
        {!user ? (
          <div className="relative z-10 flex max-w-xs flex-col items-center">
            <h3 className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium italic">
              {copy.signInTitle}
            </h3>
            <p className="mt-2 text-sm leading-5 text-white/70">{copy.signInDescription}</p>
            <a
              href="/auth/github"
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
            >
              <BrandGlyph name="github" className="size-4" />
              Continue with GitHub
            </a>
            {authError && <p role="alert" className="mt-3 text-xs text-red-200">GitHub sign-in was not completed. Please try again.</p>}
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="relative z-10 flex w-full max-w-sm flex-col items-center">
            <h3 className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium italic">
              {copy.composerTitle}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-white/65">{copy.composerDescription}</p>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <label htmlFor="community-wall-message" className="sr-only">Your note</label>
            <textarea
              id="community-wall-message"
              name="message"
              required
              maxLength={200}
              rows={3}
              onChange={(event) => setLength(event.target.value.length)}
              placeholder="Write a thoughtful message..."
              className="mt-4 w-full resize-none rounded-xl border border-white/25 bg-black/15 px-3 py-2.5 text-sm leading-5 text-white placeholder:text-white/45 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25"
            />
            <div className="mt-2 flex w-full items-center justify-between gap-4">
              <span className="font-mono text-[10px] text-white/55">{length}/200</span>
              <SubmitButton />
            </div>
            {state.message && (
              <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-xs ${state.status === "error" ? "text-red-200" : "text-emerald-200"}`}>
                {state.message}
              </p>
            )}
          </form>
        )}
        <ScallopDivider />
      </div>
      <div className="flex min-h-14 items-center justify-center px-4 text-text-secondary">
        {!user ? (
          <span className="inline-flex items-center gap-2 text-xs"><BrandGlyph name="github" className="size-4" /> Moderated submissions</span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-2 text-xs">
            {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={24} height={24} className="size-6 rounded-full ring-1 ring-border-primary" /> : <BrandGlyph name="github" className="size-4" />}
            <span className="truncate">Signed in as {user.name}</span>
          </span>
        )}
      </div>
    </article>
  );
}
