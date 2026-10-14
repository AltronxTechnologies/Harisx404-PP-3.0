"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowRight, MessageSquarePlus, RotateCcw, Send, Sparkles, Square, X } from "lucide-react";

interface Source {
  title: string;
  path: string;
}

interface Message {
  role: "user" | "model";
  content: string;
  sources?: Source[];
  complete?: boolean;
}

const suggestions = [
  { label: "Explore projects", prompt: "What featured projects has Haris built, like TourMate or Mail-Lens AI?" },
  { label: "Skills & experience", prompt: "What technologies, languages, and frameworks does Haris specialize in?" },
  { label: "Get in touch", prompt: "How can I contact Haris or collaborate with him on a project?" },
];
const hintMessages = ["Need a hand? Ask me.", "Explore the projects.", "Ask about Haris's work."];
const MAX_REPLY_CHARS = 12000;
const MAX_EVENT_BUFFER_CHARS = 32768;
const MAX_STREAM_BYTES = 128 * 1024;
const CHAT_TIMEOUT_MS = 30000;
const OFFLINE_MESSAGE = "You appear to be offline. Please check your internet connection.";

const localPath = /^\/$|^\/(?:projects|blog|about|contact|resume|credentials|links|buildlog|community-wall)(?:\/[a-z0-9-]+)?$/;
const publicPage = new Set(["/", "/projects", "/blog", "/about", "/contact", "/resume", "/credentials", "/links", "/buildlog", "/community-wall"]);
const pageLabels: Record<string, string> = {
  "/": "Home", "/projects": "Projects", "/blog": "Blog", "/about": "About", "/contact": "Contact",
  "/resume": "Resume", "/credentials": "Credentials", "/links": "Links",
  "/buildlog": "Buildlog", "/community-wall": "Community Wall", "/resume/file": "Resume",
};

function friendlyPage(path: string, sources: Source[]) {
  return sources.find((source) => source.path === path)?.title || pageLabels[path] ||
    (path.startsWith("/blog/") ? "Blog" : "Projects");
}

function safePage(path: string, sources: Source[]) {
  if (publicPage.has(path) || sources.some((source) => source.path === path)) return path;
  const index = `/${path.split("/")[1]}`;
  return publicPage.has(index) ? index : "/links";
}

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
  const withLinks = text
    .replace(/https?:\/\/(?:harisx404\.vercel\.app|harisx404\.com)\/[^\s<>)\]]*/gi, (url) => {
      const punctuation = url.match(/[.,!?;]+$/)?.[0] || "";
      try {
        const path = new URL(url.slice(0, url.length - punctuation.length)).pathname;
        return localPath.test(path) ? path === "/" ? `[Home](/)${punctuation}` : `${path}${punctuation}` : url;
      } catch {
        return url;
      }
    })
    .replace(/(^|\s)https?:\/\/[^\s<>)]+/gim, (_match, space: string) => `${space}external link omitted`)
    .replace(/(^|\s)\[(blog|projects|about|contact|resume|credentials|links|buildlog|community wall)\](?=$|[\s.,!?;)])/gim,
      (_match, space: string, name: string) => {
        const path = Object.keys(pageLabels).find((key) => pageLabels[key].toLowerCase() === name.toLowerCase());
        return path ? `${space}[${pageLabels[path]}](${path})` : _match;
      })
    .replace(/(^|\s)(\/(?:projects|blog|about|contact|resume|credentials|links|buildlog|community-wall)(?:\/[a-z0-9-]+)?)(?=$|[\s.,!?;)])/gm,
      (_match, space: string, path: string) => {
        const destination = safePage(path, sources);
        const label = friendlyPage(destination === path ? path : destination, sources)
          .replace(/\s+/g, " ").replace(/([\\`*_{}\[\]()#+.!>|-])/g, "\\$1");
        return `${space}[${label}](${destination})`;
      });
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
            if (/^https?:\/\/(?:harisx404\.vercel\.app|harisx404\.com)\//i.test(path)) path = new URL(path).pathname;
            if (localPath.test(path)) {
              const destination = safePage(path, sources);
              const label = destination !== path || (typeof children === "string" && (children.startsWith("/") || /^https?:\/\//i.test(children) || children.toLowerCase() === "blog"))
                ? friendlyPage(destination, sources) : children;
              return <Link href={destination} className="font-semibold underline decoration-text-secondary underline-offset-4 hover:decoration-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary">{label}</Link>;
            }
            if (path === "mailto:itsharis.tech@gmail.com") return <a href={path} className="font-semibold underline decoration-text-secondary underline-offset-4 hover:decoration-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary">{children === path ? "Email Haris" : children}</a>;
            return <span>{typeof children === "string" && (children.startsWith("/") || /^https?:\/\//i.test(children)) ? "External link unavailable" : children}</span>;
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
  const [hintText, setHintText] = useState(hintMessages[0]);
  const pendingRef = useRef(false);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, [input, isOpen]);

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
    if (restoreFocus) requestAnimationFrame(() => toggleRef.current?.focus());
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
          let next = 0;
          try {
            const stored = Number(localStorage.getItem("portfolio-chat-hint-next"));
            if (Number.isSafeInteger(stored) && stored >= 0) next = stored % hintMessages.length;
            localStorage.setItem("portfolio-chat-hint-next", String((next + 1) % hintMessages.length));
          } catch { /* storage may be disabled */ }
          setHintText(hintMessages[next]);
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
    const onOffline = () => {
      if (!pendingRef.current) return;
      stopGeneration();
      setError("Connection lost. Please reconnect and retry your question.");
    };
    const onOnline = () => setError((current) => current === OFFLINE_MESSAGE ? "" : current);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      abortRef.current?.abort();
    };
  }, [stopGeneration]);

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
      setError(OFFLINE_MESSAGE);
      return;
    }
    const outgoing: Message[] = retry
      ? (messages.at(-1)?.role === "model" ? messages.slice(0, -1) : messages)
      : [...(error && messages.at(-1)?.role === "model" && messages.at(-1)?.complete === false
        ? messages.slice(0, -2)
        : error && messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages), { role: "user", content: text }];
    const requestId = ++requestRef.current;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, CHAT_TIMEOUT_MS);
    abortRef.current = controller;
    pendingRef.current = true;
    setError("");
    setIsLoading(true);
    setMessages(outgoing);
    if (!retry) {
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
          // Keep rendered answers intact, but respect the API's per-turn and total history limits.
          messages: outgoing.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
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
        let body = "";
        if (response.body) {
          const jsonReader = response.body.getReader();
          const jsonDecoder = new TextDecoder();
          let bytes = 0;
          while (true) {
            const { done, value } = await jsonReader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_STREAM_BYTES) {
              await jsonReader.cancel();
              throw new Error("The answer was too long. Please retry with a shorter question.");
            }
            body += jsonDecoder.decode(value, { stream: true });
          }
          body += jsonDecoder.decode();
        } else {
          body = await response.text();
        }
        let data: { text?: unknown; sources?: unknown };
        try { data = JSON.parse(body); } catch { throw new Error("No answer came back. Please retry."); }
        if (!data || typeof data !== "object" || typeof data.text !== "string" || !data.text.trim()) throw new Error("No answer came back. Please retry.");
        if (data.text.length > MAX_REPLY_CHARS) throw new Error("The answer was too long. Please retry with a shorter question.");
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
      let receivedBytes = 0;

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
          let parsed: { text?: unknown; sources?: unknown };
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            return;
          }
          if (!parsed || typeof parsed !== "object") return;
          if (eventType === "delta" && typeof parsed.text === "string" && parsed.text) {
            if (accumulated.length + parsed.text.length > MAX_REPLY_CHARS) throw new Error("The answer was too long. Please retry with a shorter question.");
            accumulated += parsed.text;
          }
          if (eventType === "sources") sources = safeSources(parsed.sources);
          if (accumulated && requestRef.current === requestId) {
            setMessages([...outgoing, { role: "model", content: accumulated, sources, complete: false }]);
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

        receivedBytes += value.byteLength;
        if (receivedBytes > MAX_STREAM_BYTES) throw new Error("The answer was too long. Please retry with a shorter question.");
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        if (buffer.length > MAX_EVENT_BUFFER_CHARS) throw new Error("The answer was too long. Please retry with a shorter question.");

        for (const rawEvent of events) {
          if (rawEvent.length > MAX_EVENT_BUFFER_CHARS) throw new Error("The answer was too long. Please retry with a shorter question.");
          processEvent(rawEvent);
          if (complete) break;
        }
        if (complete) {
          try { await reader.cancel(); } catch { /* The completed response may already be closed. */ }
          break;
        }
      }

      // Flush decoder and process any trailing event in buffer
      buffer += decoder.decode();
      if (!complete && buffer.trim()) processEvent(buffer);

      if (!complete) throw new Error("The answer was interrupted. Please retry.");
      if (!accumulated.trim()) throw new Error("No answer came back. Please retry.");
      if (requestRef.current === requestId) setMessages([...outgoing, { role: "model", content: accumulated, sources, complete: true }]);
    } catch (cause) {
      if (requestRef.current === requestId && (!controller.signal.aborted || timedOut)) {
        setError(timedOut ? "The answer took too long. Please retry." : cause instanceof Error ? cause.message : "The connection was interrupted. Please retry.");
      }
      controller.abort();
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === requestId) {
        pendingRef.current = false;
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  }

  if (!isMounted) return null;

  return (
    <div ref={wrapperRef} className="fixed bottom-3 right-[18px] z-[5500] flex flex-col items-end min-[360px]:right-[22px] sm:bottom-5 sm:right-7 lg:right-[max(40px,calc(50vw-600px))]">
      <style jsx>{`@keyframes chat-hint-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: no-preference) { .chat-hint { animation: chat-hint-enter 350ms cubic-bezier(.2,.8,.2,1) both; } } .chat-scroll::-webkit-scrollbar { width: 6px; } .chat-scroll::-webkit-scrollbar-thumb { background: var(--text-secondary); border-radius: 999px; }`}</style>
      {isOpen && (
        <section
          id="portfolio-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Haris AI assistant"
          onClickCapture={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if ((event.target as Element).closest("a")) closeChat(false);
          }}
          className="fixed bottom-20 left-1/2 flex h-[min(480px,calc(100dvh-152px))] min-h-0 w-[min(360px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border-primary bg-white text-text-primary shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:bg-[#1a1a1c] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:relative sm:bottom-auto sm:left-auto sm:mb-4 sm:h-[min(520px,calc(100dvh-172px))] sm:w-[min(390px,calc(100vw-48px))] sm:translate-x-0 sm:rounded-3xl [@media(max-height:420px)]:h-[calc(100dvh-88px)] sm:[@media(max-height:420px)]:h-[calc(100dvh-100px)]"
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
          }} onTouchCancel={() => { swipeRef.current = null; }} className="flex shrink-0 items-center gap-2 border-b border-border-primary px-3 py-2 [@media(max-height:420px)]:py-1.5 sm:px-4 sm:py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-primary bg-bg-primary" aria-hidden="true">
              <Image src="/brand/harisx404 black transparent.png" alt="" width={28} height={28} className="size-7 object-contain dark:hidden" />
              <Image src="/brand/harisx404 white transparent.png" alt="" width={28} height={28} className="hidden size-7 object-contain dark:block" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold leading-tight text-text-primary">Haris AI Assistant</h2>
              <p className="mt-0.5 truncate text-xs leading-4 text-text-secondary">Projects, skills &amp; more</p>
            </div>
            <button type="button" onClick={startOver} disabled={!messages.length && !input && !error} aria-label="Start a new chat" title="New chat" className="flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-xl text-text-secondary transition-colors enabled:hover:bg-bg-primary enabled:hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-2.5">
              <MessageSquarePlus size={18} aria-hidden="true" />
              <span className="hidden text-xs font-medium sm:inline">New chat</span>
            </button>
            <button type="button" aria-label="Close chat" title="Close chat" onClick={() => closeChat()} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--text-secondary) transparent" }}>
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col justify-center py-2 sm:py-3">
                <h3 className="font-display text-[25px] leading-[1.12] text-text-primary">Hi, I&apos;m Haris&apos;s AI assistant.</h3>
                <p className="mt-2 max-w-[34ch] text-[13px] leading-5 text-text-secondary">Explore Haris&apos;s projects, experience and writing, or find a way to connect.</p>
                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap" aria-label="Suggested questions">
                  {suggestions.map(({ label, prompt }) => (
                    <button key={label} type="button" onClick={() => submitMessage(prompt)} disabled={isLoading} className="inline-flex min-h-9 w-full items-center justify-between gap-1.5 rounded-full border border-border-primary bg-bg-primary px-3 py-1 text-left text-xs font-medium text-text-primary transition-colors hover:border-text-secondary hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:opacity-50 dark:hover:bg-white/[0.08] sm:w-auto sm:justify-start">
                      {label}<ArrowRight size={13} className="shrink-0 text-text-secondary" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`flex flex-col gap-1.5 ${message.role === "user" ? "items-end" : "items-start"}`}>
                <span className="px-1 font-mono text-[11px] font-medium uppercase tracking-wider text-text-secondary">{message.role === "user" ? "You" : "AI assistant"}</span>
                <div aria-live={message.role === "model" ? "polite" : undefined} className={message.role === "user" ? "max-w-[85%] rounded-2xl rounded-tr-md bg-text-primary px-4 py-2.5 text-bg-primary" : "w-full min-w-0 px-1 py-1 text-text-primary"}>
                  <Reply text={message.content} sources={message.sources} />
                  {message.role === "model" && message.complete === false && !isLoading && <p className="mt-2 text-xs text-text-secondary">Incomplete answer</p>}
                  {message.role === "model" && !!message.sources?.length && (
                    <div aria-label="Relevant pages" className="mt-3 flex flex-wrap gap-1.5 border-t border-border-primary pt-3">
                      <span className="w-full font-mono text-[11px] font-medium uppercase tracking-wider text-text-secondary">Relevant pages</span>
                      {message.sources.map((source, sourceIndex) => (
                        <Link key={`${source.path}-${sourceIndex}`} href={source.path} className="inline-flex max-w-full min-h-8 items-center rounded-full border border-border-primary bg-bg-primary px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:border-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary">
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
                  <span className="size-2 animate-pulse rounded-full bg-text-primary motion-reduce:animate-none" aria-hidden="true" />
                  {messages[messages.length - 1]?.role === "model" ? "Generating response..." : "Finding an answer..."}
                </span>
                <button
                  type="button"
                  onClick={() => { stopGeneration(); setError("Response stopped. Retry the question to continue."); }}
                  aria-label="Stop generating response"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:border-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary"
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
                  {error !== OFFLINE_MESSAGE && messages.some((message) => message.role === "user") && <button type="button" onClick={() => submitMessage(messages.filter((message) => message.role === "user").at(-1)!.content, true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-primary bg-white px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:border-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:bg-white/[0.04]"><RotateCcw size={13} aria-hidden="true" />Retry question</button>}
                  <Link href="/projects" className="inline-flex min-h-9 items-center rounded-lg border border-border-primary bg-white px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary dark:bg-white/[0.04]">Explore projects</Link>
                  <Link href="/contact" className="inline-flex min-h-9 items-center rounded-lg border border-border-primary bg-white px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary dark:bg-white/[0.04]">Contact</Link>
                </div>
              </div>
                )}
                {!isAtBottom && (isLoading || messages.length > 0) && (
                  <div className="sticky bottom-2 flex justify-center">
                    <button
                      type="button"
                      onClick={scrollToBottom}
                      aria-label="Jump to latest messages"
                       className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-primary bg-text-primary px-3 py-1.5 text-xs font-medium text-bg-primary shadow-[0_8px_20px_rgba(0,0,0,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-primary"
                    >
                      <ArrowDown size={12} aria-hidden="true" />
                      <span>Jump to latest</span>
                    </button>
                  </div>
                )}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); submitMessage(input); }} className="shrink-0 border-t border-border-primary bg-white px-3 pb-2 pt-2 dark:bg-[#1a1a1c] sm:px-4">
             <div className="flex items-end gap-2 rounded-xl border border-border-primary bg-bg-primary p-1 focus-within:border-text-secondary">
              <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submitMessage(input);
                }
              }} aria-label="Ask the portfolio assistant" placeholder="Ask a question..." rows={1} maxLength={2000} disabled={isLoading} className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-text-primary placeholder:text-text-secondary focus:outline-none disabled:opacity-60" />
               <button type="submit" aria-label="Send chat message" title="Send message" disabled={!input.trim() || isLoading} className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-text-primary text-bg-primary transition-colors enabled:hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} aria-hidden="true" /></button>
            </div>
             <p className="mt-2 text-center text-xs leading-4 text-text-secondary">AI can be wrong. Verify important details.</p>
          </form>
        </section>
      )}
      {showHint && !isOpen && (
        <div role="status" className="chat-hint mb-2 flex max-w-[calc(100vw-24px)] items-center gap-0.5 rounded-full border border-border-primary bg-white p-1.5 pl-2 text-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.16)] dark:bg-[#1a1a1c] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <button type="button" onClick={openChat} className="flex min-h-8 min-w-0 items-center gap-2 whitespace-nowrap rounded-full px-2 text-xs font-medium transition-colors hover:text-purple-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary sm:text-sm">
            <Sparkles size={15} className="shrink-0 text-purple-primary" aria-hidden="true" />
            {hintText}
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
        className="group relative flex size-14 items-center justify-center rounded-full border-2 border-[#a99cce] bg-[#20202b] p-0 shadow-[0_8px_18px_rgba(19,16,35,0.18)] transition-[border-color,box-shadow] duration-200 hover:border-[#c2b6ef] hover:shadow-[0_10px_22px_rgba(55,41,111,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary dark:shadow-[0_10px_28px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_12px_30px_rgba(55,41,111,0.35)] motion-reduce:transition-none"
      >
        <AssistantRobot />
      </button>
    </div>
  );
}
