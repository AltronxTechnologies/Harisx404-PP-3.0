"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowRight, Bot, RotateCcw, Send, Sparkles, Square, X } from "lucide-react";

interface Source {
  title: string;
  path: string;
}

interface Message {
  role: "user" | "model";
  content: string;
  sources?: Source[];
}

const suggestions = [
  { label: "Featured projects", prompt: "What featured projects has Haris built, like TourMate or Mail-Lens AI?" },
  { label: "Technical skills & stack", prompt: "What technologies, languages, and frameworks does Haris specialize in?" },
  { label: "Contact & collaboration", prompt: "How can I contact Haris or collaborate with him on a project?" },
];

const localPath = /^\/(?:projects|blog|about|contact|resume|credentials|links|buildlog|community-wall)(?:\/[a-z0-9-]+)?$|^\/resume\/file$/;
const publicPage = new Set(["/projects", "/blog", "/about", "/contact", "/resume", "/credentials", "/links", "/buildlog", "/community-wall"]);

function safeSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).filter((item): item is Source =>
    item !== null && typeof item === "object" &&
    typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 100 &&
    typeof item.path === "string" && localPath.test(item.path)
  ).map(({ title, path }) => ({ title: title.trim(), path }));
}

function AssistantRobot() {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center [perspective:160px]">
      <style jsx>{`@keyframes robot-idle { 0%, 100% { transform: translateY(0) rotateY(-5deg); } 50% { transform: translateY(-2px) rotateY(5deg); } } @keyframes robot-blink { 0%, 44%, 48%, 100% { transform: scaleY(1); } 46% { transform: scaleY(.15); } } @keyframes robot-signal { 0%, 100% { opacity: .7; } 50% { opacity: 1; } } @media (prefers-reduced-motion: no-preference) { .robot-idle { animation: robot-idle 5s ease-in-out infinite; } .robot-eyes { animation: robot-blink 6s ease-in-out infinite; transform-origin: 32px 34px; } .robot-signal { animation: robot-signal 3s ease-in-out infinite; } .robot-idle:hover { animation-play-state: paused; transform: translateY(-3px) rotateY(-14deg); } }`}</style>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="robot-idle size-11 drop-shadow-[0_5px_6px_rgba(0,0,0,0.32)] motion-reduce:transform-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="robotShell" x1="12" y1="9" x2="51" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8F5FF" />
            <stop offset="0.48" stopColor="#BDB3DC" />
            <stop offset="1" stopColor="#615484" />
          </linearGradient>
          <linearGradient id="robotVisor" x1="15" y1="23" x2="48" y2="43" gradientUnits="userSpaceOnUse">
            <stop stopColor="#202344" />
            <stop offset="1" stopColor="#080D21" />
          </linearGradient>
          <linearGradient id="robotEye" x1="21" y1="29" x2="40" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A9FAFF" />
            <stop offset="1" stopColor="#66A6FF" />
          </linearGradient>
        </defs>
        <path d="M32 8V14" stroke="#C9BDF5" strokeWidth="2" strokeLinecap="round" />
        <circle className="robot-signal" cx="32" cy="7" r="3" fill="#9F8CFF" />
        <path d="M10 30C10 19 19 13 32 13S54 19 54 30v10c0 12-10 18-22 18S10 52 10 40V30Z" fill="url(#robotShell)" stroke="#B2A8CD" strokeWidth="1.5" />
        <path d="M13 26c4-8 11-11 22-10" stroke="white" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 30c0-5 4-8 9-8h16c5 0 9 3 9 8v8c0 5-4 8-9 8H24c-5 0-9-3-9-8v-8Z" fill="url(#robotVisor)" />
        <path d="M19 28c2-3 5-4 10-4h10" stroke="white" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
        <g className="robot-eyes">
          <rect x="22" y="31" width="7" height="6" rx="3" fill="url(#robotEye)" />
          <rect x="35" y="31" width="7" height="6" rx="3" fill="url(#robotEye)" />
        </g>
        <path d="M29 42c2 1 4 1 6 0" stroke="#8CD9F7" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 51c6 4 16 4 22 0" stroke="white" strokeOpacity=".55" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Reply({ text, sources = [] }: { text: string; sources?: Source[] }) {
  const withLinks = text.replace(/(^|\s)(\/(?:projects|blog|about|contact|resume|credentials|links|buildlog|community-wall)(?:\/[a-z0-9-]+)?)(?=$|[\s.,!?;)])/gm,
    (_match, space: string, path: string) => `${space}[${path}](${path})`);
  return (
    <div className="min-w-0 break-words text-sm leading-6 [&>*+*]:mt-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={["p", "strong", "em", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "code", "br", "blockquote"]}
        unwrapDisallowed
        components={{
          h1: ({ children }) => <h3 className="font-semibold text-text-primary">{children}</h3>,
          h2: ({ children }) => <h3 className="font-semibold text-text-primary">{children}</h3>,
          h3: ({ children }) => <h3 className="font-semibold text-text-primary">{children}</h3>,
          h4: ({ children }) => <h3 className="font-semibold text-text-primary">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          code: ({ children }) => <code className="break-all rounded bg-black/[0.07] px-1 py-0.5 font-mono text-xs dark:bg-white/[0.09]">{children}</code>,
          a: ({ href, children }) => {
            let path = href || "";
            if (path.startsWith("https://harisx404.com/")) path = new URL(path).pathname;
            if (localPath.test(path) && (publicPage.has(path) || sources.some((source) => source.path === path))) return <Link href={path} className="font-medium underline decoration-purple-primary/60 underline-offset-4 hover:decoration-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary">{children}</Link>;
            if (path === "mailto:itsharis.tech@gmail.com") return <a href={path} className="font-medium underline decoration-purple-primary/60 underline-offset-4 hover:decoration-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary">{children}</a>;
            return <span>{children}</span>;
          },
        }}
      >{withLinks}</ReactMarkdown>
    </div>
  );
}

export function ChatbotWidget() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const pendingRef = useRef(false);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setIsMounted(true), []);

  function dismissHint() {
    setShowHint(false);
    try { sessionStorage.setItem("portfolio-chat-hint-seen", "1"); } catch { /* storage may be disabled */ }
  }

  const stopGeneration = useCallback(() => {
    requestRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    pendingRef.current = false;
    setIsLoading(false);
  }, []);

  const closeChat = useCallback((restoreFocus = true) => {
    stopGeneration();
    setIsOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, [stopGeneration]);

  function handleScroll() {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
    setIsAtBottom(nearBottom);
  }

  function scrollToBottom() {
    setIsAtBottom(true);
    const scroller = scrollRef.current;
    scroller?.scrollTo({
      top: scroller.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  useEffect(() => {
    if (!isOpen || !isAtBottom) return;
    if (!messages.length && !isLoading && !error) return;
    const scroller = scrollRef.current;
    scroller?.scrollTo({
      top: scroller.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [isOpen, messages, error, isLoading, isAtBottom]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeChat();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        closeChat(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [isOpen, closeChat]);

  useEffect(() => {
    if (isOpen) return;
    try { if (sessionStorage.getItem("portfolio-chat-hint-seen")) return; } catch { return; }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") {
          setShowHint(true);
          try { sessionStorage.setItem("portfolio-chat-hint-seen", "1"); } catch { /* storage may be disabled */ }
          for (const name of ["pointerdown", "keydown", "scroll", "touchstart"]) window.removeEventListener(name, schedule);
        }
      }, 12000);
    };
    for (const name of ["pointerdown", "keydown", "scroll", "touchstart"]) window.addEventListener(name, schedule, { passive: true });
    schedule();
    return () => {
      clearTimeout(timer);
      for (const name of ["pointerdown", "keydown", "scroll", "touchstart"]) window.removeEventListener(name, schedule);
    };
  }, [isOpen]);

  useEffect(() => {
    const onOffline = () => setError("Network connection lost. Please check your internet connection.");
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("offline", onOffline);
      abortRef.current?.abort();
    };
  }, []);

  function openChat(event: React.MouseEvent<HTMLButtonElement>) {
    dismissHint();
    if (isOpen) {
      closeChat();
      return;
    }
    setIsOpen(true);
    if (event.detail === 0 || window.matchMedia("(min-width: 640px) and (hover: hover) and (pointer: fine)").matches) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function startOver() {
    requestRef.current++;
    abortRef.current?.abort();
    pendingRef.current = false;
    setIsLoading(false);
    setMessages([]);
    setInput("");
    setError("");
    setIsAtBottom(true);
    scrollRef.current?.scrollTo(0, 0);
    inputRef.current?.focus();
  }

  async function submitMessage(value: string, retry = false) {
    const text = value.trim();
    if (!text || pendingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You appear to be offline. Please check your internet connection.");
      return;
    }
    const outgoing: Message[] = retry
      ? (messages.at(-1)?.role === "model" ? messages.slice(0, -1) : messages)
      : [...(error ? messages.slice(0, -1) : messages), { role: "user", content: text }];
    const requestId = ++requestRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    pendingRef.current = true;
    setError("");
    setIsLoading(true);
    if (!retry) {
      setMessages(outgoing);
      setInput("");
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          messages: outgoing.slice(-20).map(({ role, content }) => ({ role, content })),
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many requests right now. Please wait a moment and retry.");
        if (response.status === 400 || response.status === 413) throw new Error("This message or conversation is too long. Start a new chat and try a shorter question.");
        throw new Error("The assistant is temporarily unavailable. Please retry in a moment.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream") || !response.body) {
        // Deterministic non-streaming fallback
        const data = await response.json();
        if (typeof data.text !== "string" || !data.text.trim()) throw new Error("No answer came back. Please retry.");
        if (requestRef.current === requestId) setMessages([...outgoing, { role: "model", content: data.text.trim(), sources: safeSources(data.sources) }]);
        return;
      }

      // Progressive SSE Stream Reading with incremental buffer
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let complete = false;
      let sources: Source[] = [];

      function processEvent(rawEvent: string) {
        if (!rawEvent.trim()) return;
        let eventType = "message";
        let dataStr = "";
        for (const line of rawEvent.split(/\r?\n/)) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) {
            const val = line.slice(5).trim();
            dataStr = dataStr ? `${dataStr}\n${val}` : val;
          }
        }
        if (eventType === "done") {
          complete = true;
        } else if (eventType === "delta" || eventType === "sources") {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === "delta" && typeof parsed.text === "string" && parsed.text) accumulated += parsed.text;
            if (eventType === "sources") sources = safeSources(parsed.sources);
            if (accumulated && requestRef.current === requestId) {
              setMessages([...outgoing, { role: "model", content: accumulated, sources }]);
            }
          } catch {
            // Ignore malformed stream events.
          }
        } else if (eventType === "error") {
          try {
            const parsed = JSON.parse(dataStr);
            throw new Error(parsed.message || "Failed to generate answer.");
          } catch (e) {
            throw (e instanceof Error ? e : new Error("Failed to generate answer."));
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";

        for (const rawEvent of events) processEvent(rawEvent);
      }

      // Flush decoder and process any trailing event in buffer
      buffer += decoder.decode();
      if (buffer.trim()) processEvent(buffer);

      if (!complete) throw new Error("The answer was interrupted. Please retry.");
      if (!accumulated.trim()) throw new Error("No answer came back. Please retry.");
    } catch (cause) {
      if (requestRef.current === requestId && !controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "The connection was interrupted. Please retry.");
      }
    } finally {
      if (requestRef.current === requestId) {
        pendingRef.current = false;
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  }

  if (!isMounted) return null;

  return (
    <div ref={wrapperRef} className="fixed bottom-3 right-3 z-[5500] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="portfolio-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Haris AI assistant"
          className="relative mb-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border-primary bg-white text-text-primary shadow-[0_24px_80px_rgba(0,0,0,0.22)] dark:bg-[#1a1a1c] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:mb-4"
          style={{ width: "min(400px, calc(100vw - 24px))", height: "min(580px, calc(100dvh - 104px))" }}
        >
          <header onTouchStart={(event) => {
            if ((event.target as Element).closest("button")) return;
            swipeRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          }} onTouchEnd={(event) => {
            if (!swipeRef.current) return;
            const dx = event.changedTouches[0].clientX - swipeRef.current.x;
            const dy = event.changedTouches[0].clientY - swipeRef.current.y;
            swipeRef.current = null;
            if ((dy > 75 && dy > Math.abs(dx) * 1.3) || (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.3)) closeChat();
          }} onTouchCancel={() => { swipeRef.current = null; }} className="flex shrink-0 items-start gap-3 border-b border-border-primary px-4 py-4 sm:px-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-purple-secondary text-purple-primary" aria-hidden="true">
              <Sparkles size={21} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary">
                <span className="size-1.5 rounded-full bg-purple-primary" aria-hidden="true" />
                Portfolio assistant
              </p>
              <h2 className="mt-1 font-display text-[28px] leading-none text-text-primary">Ask Haris.</h2>
            </div>
            <button type="button" onClick={startOver} disabled={!messages.length && !input} aria-label="Start a new chat" title="New chat" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary disabled:opacity-40 sm:size-11">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Close chat" onClick={() => closeChat()} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary sm:size-11">
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-border-primary bg-bg-primary p-5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-purple-secondary text-purple-primary" aria-hidden="true"><Bot size={18} /></span>
                <h3 className="mt-4 font-display text-[28px] leading-[1.08] text-text-primary">Curious about the work?</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">Ask about projects, technical skills, writing, or how to get in touch.</p>
                <div className="mt-5 flex flex-col gap-2" aria-label="Suggested questions">
                  {suggestions.map(({ label, prompt }) => (
                    <button key={label} type="button" onClick={() => submitMessage(prompt)} disabled={isLoading} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border-primary bg-white px-3.5 py-2.5 text-left text-sm font-medium text-text-primary transition-colors hover:border-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary disabled:opacity-50 dark:bg-white/[0.04]">
                      {label}<ArrowRight size={16} className="shrink-0 text-purple-primary" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`flex flex-col gap-1.5 ${message.role === "user" ? "items-end" : "items-start"}`}>
                <span className="px-1 font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary">{message.role === "user" ? "You" : "Haris AI"}</span>
                <div aria-live={message.role === "model" ? "polite" : undefined} className={`max-w-[92%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-text-primary text-bg-primary" : "border border-border-primary bg-bg-primary text-text-primary"}`}>
                  <Reply text={message.content} sources={message.sources} />
                  {message.role === "model" && !!message.sources?.length && (
                    <div aria-label="Relevant pages" className="mt-3 flex flex-wrap gap-1.5 border-t border-border-primary pt-3">
                      {message.sources.map((source, sourceIndex) => (
                        <Link key={`${source.path}-${sourceIndex}`} href={source.path} className="inline-flex max-w-full items-center rounded-full border border-purple-primary/40 bg-purple-secondary/30 px-2.5 py-1 text-xs font-medium text-purple-primary transition-colors hover:bg-purple-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary">
                          <span className="truncate">{source.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span role="status" className="flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-purple-primary motion-reduce:animate-none" aria-hidden="true" />
                  {messages[messages.length - 1]?.role === "model" ? "Generating response..." : "Finding an answer..."}
                </span>
                <button
                  type="button"
                  onClick={stopGeneration}
                  aria-label="Stop generating response"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:border-purple-primary hover:text-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"
                >
                  <Square size={10} fill="currentColor" aria-hidden="true" />
                  Stop
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-2xl border border-border-primary bg-bg-primary p-3.5 text-sm leading-5 text-text-primary">
                <p>{error}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => submitMessage(messages.filter((message) => message.role === "user").at(-1)?.content ?? "", true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-purple-primary/40 bg-purple-secondary/40 px-2.5 py-1 text-xs font-medium text-purple-primary transition-colors hover:bg-purple-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"><RotateCcw size={13} aria-hidden="true" />Retry question</button>
                  <Link href="/projects" className="inline-flex min-h-8 items-center rounded-lg border border-border-primary bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary dark:bg-white/[0.04]">Explore Projects</Link>
                  <Link href="/contact" className="inline-flex min-h-8 items-center rounded-lg border border-border-primary bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary dark:bg-white/[0.04]">Contact</Link>
                </div>
              </div>
            )}
          </div>

          {!isAtBottom && (isLoading || messages.length > 0) && (
            <div className="pointer-events-none absolute bottom-20 left-0 right-0 flex justify-center">
              <button
                type="button"
                onClick={scrollToBottom}
                aria-label="Jump to latest messages"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border-primary bg-text-primary px-3 py-1.5 text-xs font-medium text-bg-primary shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"
              >
                <ArrowDown size={12} aria-hidden="true" />
                <span>Jump to latest</span>
              </button>
            </div>
          )}

          <form onSubmit={(event) => { event.preventDefault(); submitMessage(input); }} className="shrink-0 border-t border-border-primary bg-white px-4 pb-3 pt-3 dark:bg-[#1a1a1c] sm:px-5">
            <div className="flex items-end gap-2 rounded-2xl border border-border-primary bg-bg-primary p-1.5 focus-within:border-purple-primary">
              <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submitMessage(input);
                }
              }} aria-label="Ask the portfolio assistant" placeholder="Ask a question..." rows={2} maxLength={2000} disabled={isLoading} className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-text-primary placeholder:text-text-secondary focus:outline-none disabled:opacity-60" />
              <button type="submit" aria-label="Send chat message" disabled={!input.trim() || isLoading} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-text-primary text-bg-primary transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary disabled:opacity-40"><Send size={17} aria-hidden="true" /></button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-4 text-text-secondary">Answers may be imperfect. Check important details.</p>
          </form>
        </section>
      )}
      {showHint && !isOpen && (
        <div role="status" className="mb-2 flex max-w-[calc(100vw-24px)] items-center gap-0.5 rounded-full border border-border-primary bg-white p-1.5 pl-2 text-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.16)] dark:bg-[#1a1a1c] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <button type="button" onClick={openChat} className="flex min-h-8 min-w-0 items-center gap-2 whitespace-nowrap rounded-full px-2 text-xs font-medium transition-colors hover:text-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary sm:text-sm">
            <Sparkles size={15} className="shrink-0 text-purple-primary" aria-hidden="true" />
            Need a hand? Ask me.
          </button>
          <button type="button" aria-label="Dismiss assistant tip" onClick={dismissHint} className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"><X size={15} aria-hidden="true" /></button>
        </div>
      )}
      <button
        ref={toggleRef}
        type="button"
        onClick={openChat}
        aria-label="Toggle chat"
        aria-expanded={isOpen}
        aria-controls="portfolio-chat-panel"
        title="Ask Haris AI Assistant"
        className="group relative flex size-14 items-center justify-center rounded-full border-2 border-[#a99cce] bg-[#20202b] p-0 shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-[border-color,box-shadow] duration-200 hover:border-[#c2b6ef] hover:shadow-[0_12px_30px_rgba(55,41,111,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary motion-reduce:transition-none"
      >
        <AssistantRobot />
      </button>
    </div>
  );
}
