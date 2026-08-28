"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Clock,
  Video,
  CheckSquare,
  ArrowRight,
  Mail,
  Check,
} from "lucide-react";
import { siteContent } from "@/app/data/site-content";

const OWNER_EMAIL = "itsharis.tech@gmail.com";

type TabId = "call" | "message";

const socialIconPaths: Record<string, string> = {
  LinkedIn:
    "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z",
  GitHub:
    "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
  Twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
};

function SocialPill({ label, href }: { label: string; href: string }) {
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900 dark:bg-white/[0.07] dark:text-white/70 dark:hover:bg-white/[0.12] dark:hover:text-white"
    >
      {isMail ? (
        <Mail className="size-4" />
      ) : (
        <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d={socialIconPaths[label] ?? socialIconPaths.Twitter} />
        </svg>
      )}
    </a>
  );
}

export function ContactClient() {
  const { contact } = siteContent;
  const [activeTab, setActiveTab] = useState<TabId>("call");
  const [message, setMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const hasCalLink = contact.calLink.trim().length > 0;

  const handleSend = () => {
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

  const tabs: { id: TabId; label: string; icon: typeof Calendar }[] = [
    { id: "call", label: "Book a Call", icon: Calendar },
    { id: "message", label: "Send Message", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-3xl py-16 sm:py-24">
      {/* Heading */}
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
          {contact.kicker}
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-text-primary md:text-6xl">
          {contact.heading}{" "}
          <em className="text-gradient-accent italic">{contact.headingAccent}</em>
        </h1>
      </div>

      {/* Tabs + socials */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <div
          role="tablist"
          aria-label="Contact options"
          className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-white/[0.06]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-white/[0.12] dark:text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-white/50 dark:hover:text-white/80"
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {contact.socials.map((s) => (
            <SocialPill key={s.label} label={s.label} href={s.href} />
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "call" ? (
            <motion.div
              key="call"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {hasCalLink ? (
                <div className="overflow-hidden rounded-3xl border border-border-primary bg-white dark:bg-white/[0.04]">
                  <iframe
                    src={`https://cal.com/${contact.calLink}?embed=true&theme=auto`}
                    title="Book a call"
                    className="h-[620px] w-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-border-primary bg-white p-8 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/harisx404.png"
                      alt="Muhammad Haris"
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-text-tertiary">Muhammad Haris</p>
                      <h2 className="text-xl font-semibold text-text-primary">
                        {contact.call.title}
                      </h2>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                    <li className="flex items-center gap-2.5">
                      <CheckSquare className="size-4 text-text-tertiary" />
                      {contact.call.note}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock className="size-4 text-text-tertiary" />
                      {contact.call.duration}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Video className="size-4 text-text-tertiary" />
                      {contact.call.platform}
                    </li>
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <a
                      href={`mailto:${OWNER_EMAIL}?subject=${encodeURIComponent("Call request — 30 min meeting")}&body=${encodeURIComponent("Hey Haris, I'd like to book a 30 minute call. Here are a few times that work for me:\n\n1.\n2.\n3.\n\nTimezone:")}`}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/85"
                    >
                      Request a call by email <ArrowRight className="size-4" />
                    </a>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-2 rounded-xl border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:text-text-primary"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-4 text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Mail className="size-4" /> {OWNER_EMAIL}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="message"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-border-primary bg-white p-8 dark:bg-white/[0.04]"
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
                  <h2 className="text-lg font-semibold text-text-primary">
                    Send Haris a message
                  </h2>
                  <p className="text-sm text-text-tertiary">I read every one</p>
                </div>
              </div>

              <textarea
                value={message}
                rows={6}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hey Haris, I have a project idea..."
                className="mt-5 w-full resize-none rounded-2xl bg-neutral-100 p-4 text-base text-text-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:bg-white/[0.06] dark:placeholder-white/30 dark:focus:ring-white/20"
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/85"
                >
                  Send message <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
