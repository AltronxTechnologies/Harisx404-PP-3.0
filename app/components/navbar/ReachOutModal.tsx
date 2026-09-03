"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ArrowRight,
  Mail,
  Check,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { BrandGlyph } from "../BrandGlyph";
import {
  circleBtn,
  pillSurface,
  CONTROL_ICON,
  CONTROL_ICON_STROKE,
} from "./modalSurfaces";
import { siteMetadata } from "@/app/data/siteMetadata";

const OWNER_EMAIL = siteMetadata.email.replace(/^mailto:/, "");
const MESSAGE_MAX = 500;

interface ReachOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

const cardSurface =
  "rounded-2xl bg-neutral-100/90 dark:bg-white/[0.07] p-6 text-center " +
  "border border-neutral-200/60 dark:border-white/[0.06] " +
  "hover:bg-neutral-200/80 dark:hover:bg-white/[0.1] transition";


const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ReachOutModal({
  isOpen,
  onClose,
  onOpenSearch,
}: ReachOutModalProps) {
  const [message, setMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escape closes, Tab is trapped inside the dialog, body scroll locked while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Only auto-focus the textarea on pointer devices — focusing it on a
    // touch screen pops the on-screen keyboard open before the user asks.
    const isPointerDevice =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (isPointerDevice) {
      textareaRef.current?.focus();
    } else {
      dialogRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  const handleContinue = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent("Project inquiry");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(OWNER_EMAIL);
      setIsCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
      setCopyFailed(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  // Clear any pending "Copied!" reset so it cannot fire after unmount.
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const socials = [
    { label: "LinkedIn", href: siteMetadata.linkedin },
    { label: "X / Twitter", href: siteMetadata.twitter },
    { label: "GitHub", href: siteMetadata.github },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-[7000] flex items-end justify-center px-4 pt-4 pb-[15px] outline-none"
          role="dialog"
          aria-modal="true"
          aria-label="Reach out"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[3.85px]"
          />

          {/* Modal (top bar + card) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose();
            }}
            className="relative z-10 mx-3 w-[92vw] max-w-[792px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <div
              className="reachout-scale"
              style={{ transformOrigin: "bottom center" }}
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
              }}
            >
            {/* Top bar — detached row above the card */}
            <div className="mb-4 flex items-center gap-[8.5px]">
              <div className={pillSurface}>
                <button
                  onClick={onClose}
                  aria-label="Back"
                  className="relative flex size-10 items-center justify-center rounded-full text-neutral-500 transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <span className="text-xl font-medium text-neutral-900 dark:text-white">
                  Reach out
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-[8.5px]">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSearch();
                  }}
                  aria-label="Search"
                  className={`${circleBtn} flex`}
                >
                  <Search className={CONTROL_ICON} />
                </button>

                <ThemeToggle
                  className={`${circleBtn} flex cursor-pointer`}
                  iconClassName={CONTROL_ICON}
                  strokeWidth={CONTROL_ICON_STROKE}
                />

                <button onClick={onClose} aria-label="Close" className={circleBtn}>
                  <X className={CONTROL_ICON} />
                </button>
              </div>
            </div>

            {/* Main card */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-neutral-200/70 dark:bg-[#1a1a1a] dark:ring-white/[0.08]"
            >
              {/* Message panel */}
              <motion.div
                variants={item}
                className="rounded-2xl bg-neutral-100/90 p-6 dark:bg-white/[0.07] border border-neutral-200/60 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/harisx404.png"
                    alt="Muhammad Haris"
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      Send Haris a message
                    </h3>
                    <p className="text-base text-text-secondary">I read every one</p>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  aria-label="Message"
                  aria-describedby="reach-out-message-limit"
                  value={message}
                  rows={3}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleContinue();
                    }
                  }}
                  placeholder="Hey Haris, I have a project idea..."
                  className="composer-scroll mt-5 w-full resize-none overflow-y-auto bg-transparent text-xl text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white dark:placeholder-white/30"
                />
                <span id="reach-out-message-limit" className="sr-only">
                  Maximum {MESSAGE_MAX} characters.
                </span>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <kbd className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[13px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                      ⏎
                    </kbd>
                    to continue ·
                    <kbd className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[13px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                      ⇧⏎
                    </kbd>
                    new line
                  </span>
                  <button
                    onClick={handleContinue}
                    disabled={!message.trim()}
                    aria-label="Continue"
                    className="ml-auto flex items-center gap-1.5 rounded-2xl border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-lg font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none dark:border-white/15 dark:bg-white/15 dark:text-white dark:hover:bg-white/25 dark:disabled:border-white/10 dark:disabled:bg-white/[0.06] dark:disabled:text-white/40"
                  >
                    Continue <ArrowRight className="size-5" />
                  </button>
                </div>
              </motion.div>

              {/* Action cards */}
              <motion.div variants={item} className="mt-4 grid grid-cols-2 gap-4">
                {/* Resume card */}
                <Link
                  href="/resume"
                  onClick={onClose}
                  className={`${cardSurface} group flex flex-col items-center`}
                >
                  <div className="mb-4 flex h-[68px] items-center justify-center">
                    <div className="flex size-[68px] items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700 transition-colors group-hover:bg-neutral-300/80 dark:bg-white/10 dark:text-white/80 dark:group-hover:bg-white/15">
                      <FileText className="size-7" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-semibold text-text-secondary">
                    View my resume
                  </h4>
                  <p className="text-base text-text-secondary">Experience · skills · work</p>
                </Link>

                <button
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  className={`${cardSurface} group flex flex-col items-center`}
                >
                  <div className="mb-4 flex h-[68px] items-center justify-center">
                    <div className="flex size-[68px] items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700 transition-colors group-hover:bg-neutral-300/80 dark:bg-white/10 dark:text-white/80 dark:group-hover:bg-white/15">
                      {isCopied ? (
                        <Check className="size-7 text-emerald-500" />
                      ) : (
                        <Mail className="size-7" />
                      )}
                    </div>
                  </div>
                  <h4
                    className="text-2xl font-semibold text-text-secondary"
                    aria-live="polite"
                  >
                    {isCopied ? "Copied!" : copyFailed ? "Copy failed" : "Email me"}
                  </h4>
                  <p className="max-w-full break-all font-mono text-base text-text-secondary">
                    {OWNER_EMAIL}
                  </p>
                </button>
              </motion.div>

              {/* Social row */}
              <motion.div variants={item} className="mt-4 grid grid-cols-3 gap-4">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${cardSurface} flex flex-col items-center gap-2`}
                  >
                    <SocialIcon label={s.label} />
                    <span className="text-base font-medium text-neutral-700 dark:text-white/80">
                      {s.label}
                    </span>
                  </a>
                ))}
              </motion.div>
            </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SocialIcon({ label }: { label: string }) {
  // Paths live in the shared BrandGlyph so the same three marks cannot drift.
  return (
    <BrandGlyph name={label} className="size-7 text-text-secondary" />
  );
}
