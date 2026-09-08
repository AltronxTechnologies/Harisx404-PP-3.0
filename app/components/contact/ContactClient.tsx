"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { BrandGlyph } from "@/app/components/BrandGlyph";
import { siteContent } from "@/app/data/site-content";
import {
  submitContactMessage,
  type ContactInput,
} from "@/app/contact/actions";

const initialForm: ContactInput = {
  name: "",
  email: "",
  subject: "",
  projectType: "project-inquiry",
  message: "",
  website: "",
  requestId: undefined,
};

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-black/[0.16] bg-transparent px-3.5 text-[15px] text-text-primary outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400/[0.72] focus:border-text-secondary focus-visible:ring-2 focus-visible:ring-neutral-300/60 dark:border-white/[0.12] dark:placeholder:text-white/30 dark:hover:border-white/[0.27] dark:focus-visible:ring-white/20";

const inquiryTypes: Array<{
  value: ContactInput["projectType"];
  label: string;
  description: string;
}> = [
  {
    value: "general-question",
    label: "General question",
    description: "Work, availability, experience, or anything you want to ask",
  },
  {
    value: "project-inquiry",
    label: "Project inquiry",
    description: "A new product, feature, platform, or technical build",
  },
  {
    value: "freelance",
    label: "Freelance project",
    description: "Short- or long-term independent project work",
  },
  {
    value: "full-time",
    label: "Full-time opportunity",
    description: "Employment, engineering roles, or team opportunities",
  },
  {
    value: "security-report",
    label: "Security report",
    description: "A vulnerability or responsible-disclosure report",
  },
  {
    value: "website-issue",
    label: "Website issue",
    description: "A bug, broken link, content error, or accessibility issue",
  },
  {
    value: "consulting",
    label: "Consulting request",
    description: "Architecture, security, AI, or technical guidance",
  },
  {
    value: "collaboration",
    label: "Collaboration / partnership",
    description: "Content, community, open-source, or partnership ideas",
  },
  {
    value: "other",
    label: "Other inquiry",
    description: "Anything that does not fit the options above",
  },
];

function ContactSocialButton({ label, href }: { label: string; href: string }) {
  const isMail = href.startsWith("mailto:");
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={isExternal ? `${label} (opens in a new tab)` : label}
      className="inline-flex size-12 items-center justify-center rounded-xl border border-border-primary text-text-secondary outline-none transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
    >
      {isMail ? <Mail className="size-[18px]" aria-hidden /> : <BrandGlyph name={label} className="size-[18px]" />}
    </a>
  );
}

export function ContactClient() {
  const { contact } = siteContent;
  const [form, setForm] = useState<ContactInput>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const submittingRef = useRef(false);
  const requestIdRef = useRef("");

  const updateField = <K extends keyof ContactInput>(key: K, value: ContactInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (formError) setFormError("");
    if (fieldErrors[key]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setFormError("");

    try {
      if (!requestIdRef.current) requestIdRef.current = crypto.randomUUID();
      const result = await submitContactMessage({
        ...form,
        requestId: requestIdRef.current,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors || {});
        setFormError(result.error);
        window.setTimeout(() => {
          formRef.current
            ?.querySelector<HTMLElement>("[aria-invalid='true']")
            ?.focus();
        }, 0);
        return;
      }

      setFieldErrors({});
      setSubmitted(true);
      window.setTimeout(() => successHeadingRef.current?.focus(), 0);
    } catch {
      setFormError(
        "The connection was interrupted. Please try again; duplicate messages will not be created.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const labelClass =
    "font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary";

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
      <aside className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] lg:sticky lg:top-28">
        <div className="px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5">
          <p className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Available for opportunities
          </p>
          <h2 className="mt-4 text-balance [font-family:var(--font-instrument-serif),serif] text-[32px] font-medium leading-none tracking-tight text-text-primary sm:text-[36px]">
            Clear ideas deserve a thoughtful reply.
          </h2>
          <p className="mt-4 text-[15px] leading-6 text-text-secondary">
            Full-time roles, freelance builds, security work, AI projects, and
            useful collaborations are all welcome.
          </p>

          <div className="mt-6 border-t border-border-primary pt-5">
            <dl className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-center gap-3">
                <Clock3 className="size-4 shrink-0" aria-hidden />
                <div>
                  <dt className="sr-only">Response time</dt>
                  <dd>Usually within one business day</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe2 className="size-4 shrink-0" aria-hidden />
                <div>
                  <dt className="sr-only">Location</dt>
                  <dd>Pakistan, working worldwide</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 shrink-0" aria-hidden />
                <div>
                  <dt className="sr-only">Privacy</dt>
                  <dd>Your details stay private</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-6 border-t border-border-primary pt-5">
            <div className="flex flex-wrap gap-2">
              {contact.socials.map((social) => (
                <ContactSocialButton key={social.label} label={social.label} href={social.href} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02]">
        <div className="px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5 lg:px-7 lg:pb-8 lg:pt-7">
          {submitted ? (
            <div role="status" className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="size-5" aria-hidden />
              </span>
              <p className="mt-5 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
                Message received
              </p>
              <h2 ref={successHeadingRef} tabIndex={-1} className="mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[38px] font-medium leading-none tracking-tight text-text-primary outline-none sm:text-[46px]">
                Thanks for reaching out.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-6 text-text-secondary">
                Your message and reply address were saved securely in the
                contact queue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setSubmitted(false);
                  requestIdRef.current = "";
                }}
                className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border-primary px-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div>
                <div className="flex h-9 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-primary text-text-secondary">
                  <MessageSquareText className="size-4" aria-hidden />
                  </span>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                    Send a message
                  </p>
                </div>
                <h2 className="mt-3 text-balance [font-family:var(--font-instrument-serif),serif] text-[32px] font-medium leading-none tracking-tight text-text-primary sm:text-[40px]">
                  Tell me what you have in mind.
                </h2>
              </div>
              <p className="mt-4 max-w-2xl text-[15px] leading-6 text-text-secondary">
                A little context goes a long way. Include the outcome you need,
                where the work stands, and any important timing.
              </p>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                All fields are required
              </p>

              <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Name</span>
                    <input
                      autoComplete="name"
                      required
                      aria-required="true"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      maxLength={80}
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                      placeholder="Your name"
                      className={fieldClass}
                    />
                    {fieldErrors.name && <span id="contact-name-error" className="mt-1.5 block text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</span>}
                  </label>
                  <label>
                    <span className={labelClass}>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      aria-required="true"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      maxLength={120}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                      placeholder="you@example.com"
                      className={fieldClass}
                    />
                    {fieldErrors.email && <span id="contact-email-error" className="mt-1.5 block text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</span>}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <span id="contact-inquiry-label" className={labelClass}>Inquiry type</span>
                    <Listbox
                      value={form.projectType}
                      onChange={(value) => updateField("projectType", value)}
                    >
                      <div className="relative">
                        <ListboxButton
                          aria-labelledby="contact-inquiry-label contact-inquiry-value"
                          aria-required="true"
                          aria-invalid={Boolean(fieldErrors.projectType)}
                          aria-describedby={fieldErrors.projectType ? "contact-inquiry-error" : undefined}
                          className={`${fieldClass} group flex items-center justify-between gap-3 pr-3 text-left`}
                        >
                          <span id="contact-inquiry-value" className="truncate">
                            {inquiryTypes.find((type) => type.value === form.projectType)?.label}
                          </span>
                          <ChevronDown className="size-4 shrink-0 text-text-secondary transition-transform duration-200 group-data-[open]:rotate-180" aria-hidden />
                        </ListboxButton>
                        <ListboxOptions
                          anchor="bottom"
                          modal={false}
                          transition
                          className="z-30 max-h-[248px] w-[var(--button-width)] origin-top overflow-y-auto rounded-xl border border-border-primary bg-bg-primary p-1.5 shadow-xl outline-none [--anchor-gap:8px] transition duration-150 ease-out data-[closed]:scale-[0.98] data-[closed]:opacity-0 [scrollbar-width:thin] [scrollbar-color:var(--border-primary)_transparent]"
                        >
                          {inquiryTypes.map((type) => (
                            <ListboxOption
                              key={type.value}
                              value={type.value}
                              className="group flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-text-secondary outline-none transition-colors data-[focus]:bg-black/[0.04] data-[focus]:text-text-primary dark:data-[focus]:bg-white/[0.06]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm group-data-[selected]:font-medium group-data-[selected]:text-text-primary">
                                  {type.label}
                                </span>
                                <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-text-secondary">
                                  {type.description}
                                </span>
                              </span>
                              <Check className="size-4 shrink-0 opacity-0 group-data-[selected]:opacity-100" aria-hidden />
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
                    {fieldErrors.projectType && <span id="contact-inquiry-error" className="mt-1.5 block text-xs text-red-600 dark:text-red-400">{fieldErrors.projectType}</span>}
                  </div>
                  <label>
                    <span className={labelClass}>Subject</span>
                    <input
                      required
                      aria-required="true"
                      value={form.subject}
                      onChange={(event) => updateField("subject", event.target.value)}
                      maxLength={120}
                      aria-invalid={Boolean(fieldErrors.subject)}
                      aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
                      placeholder="What can I help with?"
                      className={fieldClass}
                    />
                    {fieldErrors.subject && <span id="contact-subject-error" className="mt-1.5 block text-xs text-red-600 dark:text-red-400">{fieldErrors.subject}</span>}
                  </label>
                </div>

                <label className="block">
                  <span className={labelClass}>Message</span>
                  <textarea
                    required
                    aria-required="true"
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    maxLength={3000}
                    rows={7}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "contact-message-error contact-message-count" : "contact-message-count"}
                    placeholder="Share the goal, current situation, timeline, and anything else that would help."
                    className={`${fieldClass} min-h-40 resize-y py-3 leading-6`}
                  />
                  <span className="mt-1.5 flex items-start justify-between gap-4">
                    <span id="contact-message-error" className="text-xs text-red-600 dark:text-red-400">{fieldErrors.message}</span>
                    <span id="contact-message-count" className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-text-secondary">{form.message.length} / 3000</span>
                  </span>
                </label>

                <label className="absolute -left-[9999px] size-px overflow-hidden">
                  Website
                  <input
                    name="website"
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website || ""}
                    onChange={(event) => updateField("website", event.target.value)}
                  />
                </label>

                {formError && (
                  <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {formError}
                  </p>
                )}

                <span className="sr-only" role="status" aria-live="polite">
                  {isSubmitting ? "Sending your message." : ""}
                </span>

                <div className="flex flex-col gap-4 border-t border-border-primary pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-xs leading-5 text-text-secondary">
                    Your details are used only to respond to this inquiry.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative inline-flex min-h-11 items-center justify-center gap-3 overflow-hidden rounded-full bg-text-primary py-1.5 pl-6 pr-1.5 text-sm font-medium text-bg-primary shadow-lg outline-none transition-all hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)] focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden dark:via-black/10"
                    />
                    <span className="relative">
                      {isSubmitting ? "Sending message..." : "Send message"}
                    </span>
                    <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-bg-primary text-text-primary">
                      <ArrowRight
                        aria-hidden
                        className="absolute size-4 transition-transform duration-300 group-hover:translate-x-6 group-hover:opacity-0 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:opacity-100"
                      />
                      <ArrowRight
                        aria-hidden
                        className="absolute size-4 -translate-x-6 opacity-0 transition-transform duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:hidden"
                      />
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
