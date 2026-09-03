"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, X } from "lucide-react";
import {
  submitTestimonial,
  type TestimonialSubmissionInput,
} from "@/app/lib/testimonial-actions";

// Mirrors the server-side zod limits, which are sized so content always
// fits the card zones exactly (headline ≤ 2 lines, quote ≤ 6 lines).
const HEADLINE_MAX = 70;
const QUOTE_MAX = 280;

const inputClasses =
  "w-full rounded-2xl border border-border-primary bg-white px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400/20 dark:bg-white/[0.03] dark:focus:border-white/30 dark:focus:ring-white/15 sm:px-4 sm:py-2.5";

const labelClasses = "mb-1 block text-xs font-medium text-text-secondary";

type FieldErrors = Partial<
  Record<"name" | "role" | "email" | "headline" | "quote", string>
>;

export function TestimonialSubmitModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [headlineLen, setHeadlineLen] = useState(0);
  const [quoteLen, setQuoteLen] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const handleCloseRef = useRef<() => void>(() => {});
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  // Close on Escape; trap Tab inside the dialog; lock body scroll;
  // restore focus to the trigger element on close (WAI-ARIA dialog).
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Full close (with form reset) — same path as the X / backdrop.
        handleCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (![...focusables].includes(document.activeElement as HTMLElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog. Full autofocus of the first field only on
    // precision-pointer devices — on phones/tablets it would pop the
    // on-screen keyboard open before the user asks for it; there we focus
    // the dialog container instead.
    const wantsAutofocus =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    const focusTimer = setTimeout(() => {
      if (wantsAutofocus) firstFieldRef.current?.focus();
      else dialogRef.current?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const payload: TestimonialSubmissionInput = {
      name: String(fd.get("name") ?? ""),
      role: String(fd.get("role") ?? ""),
      email: String(fd.get("email") ?? ""),
      headline: String(fd.get("headline") ?? ""),
      quote: String(fd.get("quote") ?? ""),
      website: String(fd.get("website") ?? ""),
    };
    startTransition(async () => {
      const result = await submitTestimonial(payload);
      if (result.success) {
        setSubmitted(true);
      } else {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        requestAnimationFrame(() => {
          const firstInvalid = (["name", "role", "email", "headline", "quote"] as const)
            .find((field) => result.fieldErrors?.[field]);
          if (firstInvalid) {
            const field = formRef.current?.elements.namedItem(firstInvalid);
            if (field instanceof HTMLElement) field.focus();
          } else {
            formErrorRef.current?.focus();
          }
        });
      }
    });
  };

  const handleClose = () => {
    onClose();
    // Reset after the exit animation so reopening gives a fresh form.
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setSubmitted(false);
      setFormError("");
      setFieldErrors({});
      setHeadlineLen(0);
      setQuoteLen(0);
      formRef.current?.reset();
      resetTimerRef.current = null;
    }, 250);
  };
  handleCloseRef.current = handleClose;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Scroll container: on short screens the dialog is taller than
          // the viewport, so the overlay itself scrolls — the top of the
          // form can never be clipped behind the navbar.
          // z-[6000] beats the navbar (z-[5000]) so nothing ever renders
          // above the dialog while it's open.
          className="fixed inset-0 z-[6000] overflow-y-auto"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimonial-modal-title"
        >
          {/* Backdrop — click closes; tabIndex -1 keeps this invisible
              full-screen button out of the Tab order (the visible X inside
              the dialog is the keyboard-reachable close control). */}
          <button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            onClick={handleClose}
            className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />

          <div className="flex min-h-full items-center justify-center p-4 py-10 sm:py-12">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 300, damping: 28 }
              }
              className="relative w-full max-w-lg rounded-3xl border border-border-primary bg-white p-4 shadow-2xl dark:bg-[#111] sm:p-8"
            >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border-primary text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
            >
              <X className="size-4" aria-hidden />
            </button>

            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center py-10 text-center"
              >
                <CheckCircle2
                  className="h-12 w-12 text-emerald-500"
                  aria-hidden
                />
                <h3
                  id="testimonial-modal-title"
                  className="mt-4 font-display text-2xl italic text-text-primary"
                >
                  Thank you!
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                  Your testimonial has been submitted and is now awaiting
                  review. It will appear on the site once approved.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-full border border-border-primary px-6 py-2 text-sm font-medium text-text-primary transition-colors hover:border-text-tertiary"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3
                  id="testimonial-modal-title"
                  className="font-display text-xl italic text-text-primary sm:text-2xl"
                >
                  Share your experience
                </h3>
                <p className="mt-1 text-xs text-text-secondary sm:mt-1.5 sm:text-sm">
                  Worked with me? I&apos;d love to hear about it. Submissions
                  are reviewed before they appear on the site.
                </p>

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="mt-3.5 flex flex-col gap-2.5 sm:mt-6 sm:gap-4"
                  noValidate
                >
                  {/* Honeypot — hidden from real users, catnip for bots. */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                  >
                    <label htmlFor="ts-website">Website</label>
                    <input
                      id="ts-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <label htmlFor="ts-name" className={labelClasses}>
                        Your name <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="ts-name"
                        name="name"
                        type="text"
                        maxLength={80}
                        required
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "ts-name-error" : undefined}
                        placeholder="Jane Smith"
                        className={inputClasses}
                      />
                      {fieldErrors.name && (
                        <p id="ts-name-error" className="mt-1 text-xs text-red-500">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="ts-role" className={labelClasses}>
                        Role &amp; company <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ts-role"
                        name="role"
                        type="text"
                        maxLength={80}
                        required
                        aria-invalid={Boolean(fieldErrors.role)}
                        aria-describedby={fieldErrors.role ? "ts-role-error" : undefined}
                        placeholder="CTO, Acme Inc."
                        className={inputClasses}
                      />
                      {fieldErrors.role && (
                        <p id="ts-role-error" className="mt-1 text-xs text-red-500">
                          {fieldErrors.role}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ts-email" className={labelClasses}>
                      Email <span className="text-red-500">*</span>{" "}
                      <span className="font-normal text-text-secondary">
                        (private — used to verify it&apos;s you &amp; fetch
                        your Gravatar photo)
                      </span>
                    </label>
                    <input
                      id="ts-email"
                      name="email"
                      type="email"
                      maxLength={120}
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "ts-email-error" : undefined}
                      placeholder="jane@company.com"
                      className={inputClasses}
                    />
                    {fieldErrors.email && (
                      <p id="ts-email-error" className="mt-1 text-xs text-red-500">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="ts-headline" className={labelClasses}>
                        Headline <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] tabular-nums text-text-secondary">
                        {headlineLen}/{HEADLINE_MAX}
                      </span>
                    </div>
                    <input
                      id="ts-headline"
                      name="headline"
                      type="text"
                      maxLength={HEADLINE_MAX}
                      required
                      aria-invalid={Boolean(fieldErrors.headline)}
                      aria-describedby={fieldErrors.headline ? "ts-headline-error" : undefined}
                      placeholder="A one-line summary, e.g. “Delivered beyond expectations.”"
                      className={inputClasses}
                      onChange={(e) => setHeadlineLen(e.target.value.length)}
                    />
                    {fieldErrors.headline && (
                      <p id="ts-headline-error" className="mt-1 text-xs text-red-500">
                        {fieldErrors.headline}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="ts-quote" className={labelClasses}>
                        Your testimonial <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] tabular-nums text-text-secondary">
                        {quoteLen}/{QUOTE_MAX}
                      </span>
                    </div>
                    <textarea
                      id="ts-quote"
                      name="quote"
                      rows={4}
                      maxLength={QUOTE_MAX}
                      required
                      aria-invalid={Boolean(fieldErrors.quote)}
                      aria-describedby={fieldErrors.quote ? "ts-quote-error" : undefined}
                      placeholder="What did we work on together? What was the result?"
                      className={`${inputClasses} resize-none`}
                      onChange={(e) => setQuoteLen(e.target.value.length)}
                    />
                    {fieldErrors.quote && (
                      <p id="ts-quote-error" className="mt-1 text-xs text-red-500">
                        {fieldErrors.quote}
                      </p>
                    )}
                  </div>

                  {formError && (
                    <p
                      ref={formErrorRef}
                      role="alert"
                      tabIndex={-1}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-0.5 inline-flex items-center justify-center gap-2 rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black sm:mt-1 sm:py-3"
                  >
                    {isPending && (
                      <Loader2
                        className={`size-4 ${prefersReducedMotion ? "" : "animate-spin"}`}
                        aria-hidden
                      />
                    )}
                    {isPending ? "Submitting…" : "Submit for review"}
                  </button>
                </form>
              </>
            )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
