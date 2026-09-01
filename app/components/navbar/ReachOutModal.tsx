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
import { siteMetadata } from "@/app/data/siteMetadata";

const OWNER_EMAIL = "itsharis.tech@gmail.com";

interface ReachOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

const cardSurface =
  "rounded-2xl bg-neutral-100/90 dark:bg-white/[0.07] p-5 text-center " +
  "border border-neutral-200/60 dark:border-white/[0.06] " +
  "hover:bg-neutral-200/80 dark:hover:bg-white/[0.1] transition";

const circleBtn =
  "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#1c1c1c] " +
  "text-neutral-600 dark:text-white/80 shadow-lg shadow-black/5 dark:shadow-none " +
  "transition-colors hover:text-neutral-900 dark:hover:text-white active:scale-95";

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
          className="fixed inset-0 z-[7000] flex items-end justify-center p-4 pb-[6vh] sm:pb-[8vh]"
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
            className="relative z-10 mx-3 w-[92vw] max-w-[660px]"
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
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 flex-1 items-center gap-2 rounded-2xl bg-white px-3 shadow-lg shadow-black/5 dark:bg-[#1c1c1c] dark:shadow-none">
                <button
                  onClick={onClose}
                  aria-label="Back"
                  className="flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <span className="text-lg font-medium text-neutral-900 dark:text-white">
                  Reach out
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                aria-label="Search"
                className={`${circleBtn} flex`}
              >
                <Search className="size-6" />
              </button>

              <ThemeToggle
                className={`${circleBtn} flex cursor-pointer`}
              />

              <button onClick={onClose} aria-label="Close" className={circleBtn}>
                <X className="size-6" />
              </button>
            </div>

            {/* Main card */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-neutral-200/70 dark:bg-[#1a1a1a] dark:ring-white/[0.08]"
            >
              {/* Message panel */}
              <motion.div
                variants={item}
                className="rounded-2xl bg-neutral-100/90 p-5 dark:bg-white/[0.07] border border-neutral-200/60 dark:border-white/[0.06]"
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
                    <p className="text-sm text-text-tertiary">I read every one</p>
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
                  className="mt-4 w-full resize-none bg-transparent text-lg text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white dark:placeholder-white/30"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <kbd className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[11px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                      ⏎
                    </kbd>
                    to continue ·
                    <kbd className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[11px] leading-none text-neutral-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                      ⇧⏎
                    </kbd>
                    new line
                  </span>
                  <button
                    onClick={handleContinue}
                    disabled={!message.trim()}
                    aria-label="Continue"
                    className="ml-auto flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-base text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  >
                    Continue <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>

              {/* Action cards */}
              <motion.div variants={item} className="mt-3 grid grid-cols-[1.3fr_1fr] gap-3">
                {/* Resume card */}
                <Link
                  href="/resume"
                  onClick={onClose}
                  className={`${cardSurface} group flex flex-col items-center`}
                >
                  <div className="mb-4 flex items-center justify-center pt-2">
                    <div className="flex size-14 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700 transition-colors group-hover:bg-neutral-300/80 dark:bg-white/10 dark:text-white/80 dark:group-hover:bg-white/15">
                      <FileText className="size-6" />
                    </div>
                  </div>
                  <h4 className="text-[22px] font-semibold text-neutral-900 dark:text-white">
                    View my resume
                  </h4>
                  <p className="text-base text-text-tertiary">Experience · skills · work</p>
                </Link>

                <button
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  className={`${cardSurface} flex flex-col items-center`}
                >
                  <div className="mb-4 flex size-14 items-center justify-center pt-2">
                    {isCopied ? (
                      <Check className="size-11 text-emerald-500" />
                    ) : (
                      <Mail className="size-11 text-text-tertiary" strokeWidth={1.5} />
                    )}
                  </div>
                  <h4 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {isCopied ? "Copied!" : "Email me"}
                  </h4>
                  <p className="max-w-full break-all font-mono text-[15px] text-text-tertiary">
                    {OWNER_EMAIL}
                  </p>
                </button>
              </motion.div>

              {/* Social row */}
              <motion.div variants={item} className="mt-3 grid grid-cols-3 gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${cardSurface} flex flex-col items-center gap-2`}
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
  const cls = "size-6 fill-current text-text-tertiary";
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
