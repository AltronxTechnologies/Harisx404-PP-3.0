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
import { BrandGlyph } from "@/app/components/BrandGlyph";

const OWNER_EMAIL = "itsharis.tech@gmail.com";

type TabId = "call" | "message";

/**
 * Renamed from `SocialPill` to `ContactSocialButton`: the shared
 * app/components/SocialPill.tsx exports a *different* component (the footer's
 * grouped pill, no props) under the same name. Two unrelated components with
 * one name is a trap. Brand paths now come from the shared BrandGlyph.
 */
function ContactSocialButton({ label, href }: { label: string; href: string }) {
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
        <BrandGlyph name={label} className="size-4" />
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
    <div className="w-full">
      {/* Tabs + socials */}
      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <ContactSocialButton key={s.label} label={s.label} href={s.href} />
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
                      <p className="text-sm text-text-secondary">Muhammad Haris</p>
                      <h2 className="text-xl font-semibold text-text-primary">
                        {contact.call.title}
                      </h2>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                    <li className="flex items-center gap-2.5">
                      <CheckSquare className="size-4 text-text-secondary" />
                      {contact.call.note}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock className="size-4 text-text-secondary" />
                      {contact.call.duration}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Video className="size-4 text-text-secondary" />
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
                      className="flex items-center gap-2 rounded-xl border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 dark:active:border-white/25"
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
                  <p className="text-sm text-text-secondary">I read every one</p>
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
