"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bot, MessageCircle, RotateCcw, Send, Sparkles, Square, WifiOff, X } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

const suggestions = [
  { label: "Featured projects", prompt: "What featured projects has Haris built, like TourMate or Mail-Lens AI?" },
  { label: "Technical skills & stack", prompt: "What technologies, languages, and frameworks does Haris specialize in?" },
  { label: "Contact & collaboration", prompt: "How can I contact Haris or collaborate with him on a project?" },
];

const localPath = /^\/(?:projects|blog|about|contact|resume|credentials|buildlog|community-wall)(?:\/[a-z0-9-]+)?$/;

function AssistantOrb() {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-7 transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 motion-reduce:transform-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="0.5" stopColor="#6C47FF" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="orbGloss" x1="8" y1="6" x2="24" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbVisor" x1="10" y1="13" x2="22" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="3 3" className="animate-[spin_20s_linear_infinite] motion-reduce:animate-none" />
        <circle cx="16" cy="16" r="11" fill="url(#orbGrad)" />
        <ellipse cx="16" cy="10" rx="7" ry="3.5" fill="url(#orbGloss)" />
        <rect x="10.5" y="13.5" width="11" height="5" rx="2.5" fill="url(#orbVisor)" />
        <circle cx="13.5" cy="16" r="1" fill="#FFFFFF" />
        <circle cx="18.5" cy="16" r="1" fill="#FFFFFF" />
        <circle cx="16" cy="3.5" r="1.5" fill="#A855F7" />
        <line x1="16" y1="5" x2="16" y2="7.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
      <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex size-2.5 rounded-full border-2 border-text-primary bg-emerald-400" />
      </span>
    </span>
  );
}

function formatInline(str: string): React.ReactNode {
  const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="rounded bg-black/[0.07] px-1 py-0.5 font-mono text-[11px] font-semibold text-text-primary dark:bg-white/[0.09]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function Reply({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-6">
      {text.split(/(^|[\s(])(\/(?:projects|blog|about|contact|resume|credentials|buildlog|community-wall)(?:\/[a-z0-9-]+)?)(?=$|[\s.,!?;)])/g).map((part, index) =>
        localPath.test(part) ? (
          <Link
            key={index}
            href={part}
            className="font-medium underline decoration-purple-primary/60 underline-offset-4 hover:decoration-purple-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"
          >
            {part}
          </Link>
        ) : (
          <span key={index}>{formatInline(part)}</span>
        )
      )}
    </div>
  );
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const pendingRef = useRef(false);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

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
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
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
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (event.detail === 0 || window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
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
    inputRef.current?.focus();
  }

  function stopGeneration() {
    abortRef.current?.abort();
    pendingRef.current = false;
    setIsLoading(false);
  }

  async function submitMessage(value: string, retry = false) {
    const text = value.trim();
    if (!text || pendingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You appear to be offline. Please check your internet connection.");
      return;
    }
    const outgoing: Message[] = retry
      ? messages
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
          messages: outgoing.slice(-20),
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
        if (requestRef.current === requestId) setMessages([...outgoing, { role: "model", content: data.text.trim() }]);
        return;
      }

      // Progressive SSE Stream Reading with incremental buffer
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;
          let eventType = "message";
          let dataStr = "";
          const lines = rawEvent.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            else if (line.startsWith("data:")) {
              const val = line.slice(5).trim();
              dataStr = dataStr ? `${dataStr}\n${val}` : val;
            }
          }

          if (eventType === "delta") {
            try {
              const parsed = JSON.parse(dataStr);
              if (typeof parsed.text === "string" && parsed.text) {
                accumulated += parsed.text;
                if (requestRef.current === requestId) {
                  setMessages([...outgoing, { role: "model", content: accumulated }]);
                }
              }
            } catch {
              // ignore malformed delta
            }
          } else if (eventType === "error") {
            try {
              const errData = JSON.parse(dataStr);
              throw new Error(errData.message || "Failed to generate answer.");
            } catch (e) {
              throw (e instanceof Error ? e : new Error("Failed to generate answer."));
            }
          }
        }
      }

      // Flush decoder and process any trailing event in buffer
      buffer += decoder.decode();
      if (buffer.trim()) {
        const lines = buffer.split(/\r?\n/);
        let eventType = "message";
        let dataStr = "";
        for (const line of lines) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) {
            const val = line.slice(5).trim();
            dataStr = dataStr ? `${dataStr}\n${val}` : val;
          }
        }
        if (eventType === "delta") {
          try {
            const parsed = JSON.parse(dataStr);
            if (typeof parsed.text === "string" && parsed.text) {
              accumulated += parsed.text;
              if (requestRef.current === requestId) {
                setMessages([...outgoing, { role: "model", content: accumulated }]);
              }
            }
          } catch {
            // ignore
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error("No answer came back. Please retry.");
      }
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

  return (
    <div className="fixed bottom-3 right-3 z-[5500] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="portfolio-chat-panel"
          aria-label="Haris AI assistant"
          className="relative mb-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border-primary bg-white text-text-primary shadow-[0_24px_80px_rgba(0,0,0,0.22)] dark:bg-[#1a1a1c] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:mb-4"
          style={{ width: "min(400px, calc(100vw - 24px))", height: "min(580px, calc(100dvh - 104px))" }}
        >
          <header className="flex shrink-0 items-start gap-3 border-b border-border-primary px-4 py-4 sm:px-5">
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
            <button type="button" aria-label="Close chat" onClick={() => { setIsOpen(false); toggleRef.current?.focus(); }} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary sm:size-11">
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
                  <Reply text={message.content} />
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
                  <button type="button" onClick={() => submitMessage(messages[messages.length - 1]?.content ?? "", true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-purple-primary/40 bg-purple-secondary/40 px-2.5 py-1 text-xs font-medium text-purple-primary transition-colors hover:bg-purple-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"><RotateCcw size={13} aria-hidden="true" />Retry question</button>
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
      <button
        ref={toggleRef}
        type="button"
        onClick={openChat}
        aria-label="Toggle chat"
        aria-expanded={isOpen}
        aria-controls="portfolio-chat-panel"
        title="Ask Haris AI Assistant"
        className="group relative flex min-h-14 items-center gap-3 rounded-full border border-border-primary bg-text-primary pl-3.5 pr-5 text-sm font-medium text-bg-primary shadow-[0_12px_36px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(108,71,255,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <AssistantOrb />
        <div className="flex flex-col items-start text-left">
          <span className="font-semibold leading-tight tracking-tight">Ask Haris AI</span>
          <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-bg-primary/70">Assistant</span>
        </div>
      </button>
    </div>
  );
}
