"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, PenLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CommunityWallActionState } from "@/app/community-wall/actions";
import { ScallopDivider } from "./ScallopDivider";
import { BrandGlyph } from "@/app/components/BrandGlyph";
import { CommunityWallAvatar } from "./CommunityWallAvatar";

const useActionStateCompat: typeof useFormState =
  (React as unknown as { useActionState?: typeof useFormState }).useActionState ?? useFormState;
const initialState: CommunityWallActionState = { status: "idle", message: "" };
const gradient = "radial-gradient(120% 100% at 30% 20%, rgba(88,28,135,0.92), rgba(30,10,60,0.95))";

function Doodles() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <svg className="absolute -right-2 -top-2 size-24 opacity-15" fill="none" stroke="white" strokeLinecap="round" strokeWidth="4" viewBox="0 0 141 149"><path d="M27 62V75M45 51h9M27 34v-6M3 49h13M18 40l-3-3M40 40l5-3M40 60l5 4M15 61l-6 4" /></svg>
    <svg className="absolute bottom-7 left-3 size-10 rotate-12 opacity-15" fill="none" stroke="white" strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 64 64"><path d="M12 52 44 8c1-2 3-2 5 0l1 1c2 2 1 4 0 5L18 58M40 12l6 6" /></svg>
  </div>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
    {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <PenLine aria-hidden="true" className="size-4" />}{pending ? "Submitting..." : "Submit note"}
  </button>;
}

type Props = {
  user: { id: string; name: string; avatarUrl?: string | null } | null;
  hasSubmitted?: boolean;
  action: (previous: CommunityWallActionState, formData: FormData) => Promise<CommunityWallActionState>;
  authError?: boolean;
  copy: { signInTitle: string; signInDescription: string; composerTitle: string; composerDescription: string };
};

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.31.31-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.51l3.35-2.6Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z"/></svg>;
}

export function GuestbookActionCard({ user, action, copy, authError = false, hasSubmitted = false }: Props) {
  const [open, setOpen] = React.useState(authError);
  const [mounted, setMounted] = React.useState(false);
  const [length, setLength] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionStateCompat(action, initialState);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const close = React.useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (state.status === "success") { formRef.current?.reset(); setLength(0); router.refresh(); }
  }, [router, state]);
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        !element.hasAttribute("data-community-wall-modal") &&
        !["SCRIPT", "STYLE"].includes(element.tagName),
    );
    const previousState = background.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));
    background.forEach((element) => {
      element.setAttribute("aria-hidden", "true");
      element.inert = true;
    });
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input:not([type="hidden"])')];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      previousState.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
        element.inert = inert;
      });
      document.removeEventListener("keydown", keydown);
    };
  }, [close, open]);

  return <>
    <article className="relative z-20 flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
      <div className="relative flex min-h-44 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-6 py-6 pb-10 text-center text-white" style={{ background: gradient }}>
        <Doodles />
        <div className="relative z-10"><h3 className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium italic">&ldquo;{copy.signInTitle}...&rdquo;</h3><p className="mt-1 text-xs text-white/50">{copy.signInDescription}</p></div>
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:bg-white/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"><PenLine aria-hidden="true" className="size-3.5" />Write a message...</button>
        <ScallopDivider />
      </div>
      <div className="relative z-10 -mt-px flex min-h-12 items-center justify-center gap-2 bg-white px-4 pb-3 pt-2 text-text-secondary dark:bg-neutral-900"><span className="flex size-7 items-center justify-center rounded-full border border-border-primary"><BrandGlyph name="github" className="size-3.5" /></span><span className="flex size-7 items-center justify-center rounded-full border border-border-primary"><GoogleIcon /></span></div>
    </article>

    {mounted && createPortal(<AnimatePresence>{open && <>
      <motion.div data-community-wall-modal aria-hidden="true" className="fixed inset-0 z-[4999] bg-black/60 backdrop-blur-sm dark:bg-black/75" onClick={close} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduceMotion ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} />
      <motion.div data-community-wall-modal ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="community-wall-dialog-title" className="fixed left-1/2 top-1/2 z-[5000] w-[calc(100%-32px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900" initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.95, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.95, x: "-50%", y: "-50%" }} transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}>
        <button ref={closeRef} type="button" onClick={close} aria-label="Close Community Wall dialog" className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white hover:bg-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X aria-hidden="true" className="size-4" /></button>
        <div className="relative flex min-h-44 flex-col items-center justify-center overflow-hidden px-8 py-7 pb-10 text-center text-white" style={{ background: gradient }}><Doodles /><div className="relative z-10"><h2 id="community-wall-dialog-title" className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium italic">{copy.composerTitle}</h2><p className="mt-2 text-sm leading-5 text-white/60">{user ? copy.composerDescription : copy.signInDescription}</p></div><ScallopDivider /></div>
        <div className="-mt-2 px-8 pb-8">
          {!user ? <div className="flex flex-col gap-3"><a href="/auth/github" className="flex h-12 items-center justify-center gap-3 rounded-xl bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"><BrandGlyph name="github" className="size-5" />Continue with GitHub</a><a href="/auth/google" className="flex h-12 items-center justify-center gap-3 rounded-xl border border-border-primary bg-white text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"><GoogleIcon />Continue with Google</a>{authError && <p role="alert" className="text-center text-xs text-red-600 dark:text-red-300">Account sign-in was not completed. Please try again.</p>}</div> : hasSubmitted || state.status === "success" ? <div className="flex flex-col items-center py-3 text-center"><CommunityWallAvatar src={user.avatarUrl} name={user.name} identity={user.id} className="size-10" /><p className="mt-3 text-sm font-semibold text-text-primary">{state.status === "success" ? state.message : "Your note is already on the wall."}</p><p className="mt-1 text-xs leading-5 text-text-secondary">Each account can add one note. Contact the site Admin if it needs to be removed.</p></div> : <form ref={formRef} action={formAction}><div className="mb-3 flex min-w-0 items-center gap-2"><CommunityWallAvatar src={user.avatarUrl} name={user.name} identity={user.id} className="size-6" /><span className="truncate text-xs text-text-secondary">Signed in as {user.name}</span></div><input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" /><label htmlFor="community-wall-message" className="sr-only">Your note</label><textarea id="community-wall-message" name="message" required maxLength={200} rows={4} onChange={(event) => setLength(event.target.value.length)} placeholder="Write a thoughtful message..." className="w-full resize-none rounded-xl border border-border-primary bg-bg-primary px-3 py-2.5 text-sm leading-5 text-text-primary placeholder:text-text-secondary focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/25 dark:focus:border-white/30" /><div className="mb-4 mt-1.5 text-right font-mono text-[10px] text-text-secondary">{length}/200</div><SubmitButton />{state.message && <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-center text-xs ${state.status === "error" ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>{state.message}</p>}</form>}
        </div>
      </motion.div>
    </>}</AnimatePresence>, document.body)}
  </>;
}
