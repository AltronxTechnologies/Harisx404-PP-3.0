"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const OWNER_EMAIL = "itsharis.tech@gmail.com";

interface ReachOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

/* Reference glass recipe: white/70 (light) · neutral-900/70 (dark),
   backdrop-blur-2xl + saturate-150, with the layered inner highlight +
   hairline + soft drop shadow. */
const glass =
  "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl backdrop-saturate-150 " +
  "[box-shadow:inset_0_1px_1px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.5),0_12px_32px_-12px_rgba(0,0,0,0.25)] " +
  "dark:[box-shadow:inset_0_1px_1px_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.07),0_12px_32px_-12px_rgba(0,0,0,0.6)]";

/* size-11 rounded-2xl glass control buttons (search / theme / close) */
const controlBtn =
  `${glass} flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl ` +
  "text-neutral-700 dark:text-white/80 transition duration-200 " +
  "hover:bg-white/80 dark:hover:bg-white/15 hover:text-neutral-900 dark:hover:text-white active:scale-95";

/* Inner sub-cards sitting on the glass sheet */
const cardSurface =
  "rounded-2xl bg-white/60 dark:bg-white/[0.06] p-5 text-center " +
  "border border-white/60 dark:border-white/[0.08] " +
  "hover:bg-white/80 dark:hover:bg-white/[0.1] transition duration-200";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Escape closes + body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onClose]);

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleContinue = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent("Project inquiry");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(OWNER_EMAIL);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const socials = [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/harisx404/" },
    { label: "X / Twitter", href: "https://twitter.com/harisx404" },
    { label: "GitHub", href: "https://github.com/harisx404" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[7000] flex items-end justify-center sm:p-4 sm:pb-[8vh]"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-[3px]"
          />

          {/* Drawer (mobile: bottom sheet w/ 12px inset · desktop: centered modal) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose();
            }}
            className="relative z-10 w-full px-3 pb-3 sm:w-[92vw] sm:max-w-[620px] sm:px-0 sm:pb-0"
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
              {/* Top action bar — h-13 row, gap-2.5 */}
              <div className="mb-2.5 flex h-13 items-center gap-2.5">
                <button
                  onClick={onClose}
                  className={`${glass} flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-2xl px-4 text-left transition duration-200 hover:bg-white/80 dark:hover:bg-white/15 active:scale-[0.98]`}
                >
                  <ChevronLeft className="size-4 text-neutral-500 dark:text-white/60" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    Reach out
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSearch();
                  }}
                  aria-label="Search"
                  className={controlBtn}
                >
                  <Search className="size-5" />
                </button>

                <ThemeToggle className={controlBtn} />

                <button onClick={onClose} aria-label="Close" className={controlBtn}>
                  <X className="size-5" />
                </button>
              </div>

              {/* Content sheet — glass, rounded-3xl, capped height w/ internal scroll on mobile */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className={`${glass} max-h-[min(500px,65dvh)] overflow-y-auto overscroll-contain rounded-3xl p-2.5 sm:max-h-[70dvh] sm:p-3`}
              >
                {/* Message panel */}
                <motion.div
                  variants={item}
                  className="rounded-2xl border border-white/60 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/harisx404.png"
                      alt="Muhammad Haris"
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        Send Haris a message
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        I read every one
                      </p>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={message}
                    rows={3}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      autoGrow();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleContinue();
                      }
                    }}
                    placeholder="Hey Haris, I have a project idea..."
                    className="mt-4 w-full resize-none bg-transparent text-base text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white dark:placeholder-white/30 sm:text-lg"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="hidden items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 sm:flex">
                      <kbd className="rounded-md border border-neutral-300/70 bg-white/70 px-1.5 py-0.5 font-mono text-[11px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                        ⏎
                      </kbd>
                      to continue ·
                      <kbd className="rounded-md border border-neutral-300/70 bg-white/70 px-1.5 py-0.5 font-mono text-[11px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                        ⇧⏎
                      </kbd>
                      new line
                    </span>
                    <button
                      onClick={handleContinue}
                      disabled={!message.trim()}
                      aria-label="Continue"
                      className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm text-neutral-900 transition duration-200 hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:text-base"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </motion.div>

                {/* Action cards */}
                <motion.div
                  variants={item}
                  className="mt-2.5 grid grid-cols-1 gap-2.5 sm:mt-3 sm:grid-cols-[1.3fr_1fr] sm:gap-3"
                >
                  {/* Resume card */}
                  <Link
                    href="/resume"
                    onClick={onClose}
                    className={`${cardSurface} group flex items-center gap-4 text-left sm:flex-col sm:items-center sm:text-center`}
                  >
                    <div className="flex items-center justify-center sm:mb-4 sm:pt-2">
                      <div className="flex size-11 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-sm transition-colors group-hover:bg-white dark:bg-white/10 dark:text-white/80 dark:shadow-none dark:group-hover:bg-white/15 sm:size-14">
                        <FileText className="size-5 sm:size-6" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-neutral-900 dark:text-white sm:text-[22px]">
                        View my resume
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 sm:text-base">
                        Experience · skills · work
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={handleCopyEmail}
                    aria-label="Copy email address"
                    className={`${cardSurface} flex cursor-pointer items-center gap-4 text-left sm:flex-col sm:items-center sm:text-center`}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center sm:mb-4 sm:size-14 sm:pt-2">
                      {isCopied ? (
                        <Check className="size-7 text-emerald-500 sm:size-11" />
                      ) : (
                        <Mail
                          className="size-7 text-neutral-500 dark:text-neutral-400 sm:size-11"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-neutral-900 dark:text-white sm:text-xl">
                        {isCopied ? "Copied!" : "Email me"}
                      </h4>
                      <p className="max-w-full truncate font-mono text-[13px] text-neutral-500 dark:text-neutral-400 sm:break-all sm:whitespace-normal sm:text-[15px]">
                        {OWNER_EMAIL}
                      </p>
                    </div>
                  </button>
                </motion.div>

                {/* Social row */}
                <motion.div
                  variants={item}
                  className="mt-2.5 grid grid-cols-3 gap-2.5 sm:mt-3 sm:gap-3"
                >
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${cardSurface} flex flex-col items-center gap-2 !p-4 sm:!p-5`}
                    >
                      <SocialIcon label={s.label} />
                      <span className="text-sm font-medium text-neutral-700 dark:text-white/80">
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
  const cls = "size-6 fill-current text-neutral-500 dark:text-neutral-400";
  if (label === "LinkedIn") {
    return (
      <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z" />
      </svg>
    );
  }
  if (label === "GitHub") {
    return (
      <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
