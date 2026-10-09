"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

const suggestions = [
  { label: "Explore projects", prompt: "What projects has Haris built?" },
  { label: "Skills & stack", prompt: "What technologies does Haris work with?" },
  { label: "Get in touch", prompt: "How can I contact Haris?" },
];

const localPath = /^\/(?:projects|blog|about|contact|resume|credentials|buildlog|community-wall)(?:\/[a-z0-9-]+)?$/;

function Reply({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap break-words text-sm leading-6">
    {text.split(/(^|[\s(])(\/(?:projects|blog|about|contact|resume|credentials|buildlog|community-wall)(?:\/[a-z0-9-]+)?)(?=$|[\s.,!?;)])/g).map((part, index) =>
      localPath.test(part)
        ? <Link key={index} href={part} className="font-medium underline decoration-purple-primary/60 underline-offset-4 hover:decoration-purple-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary">{part}</Link>
        : part
    )}
  </p>;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const scroller = scrollRef.current;
    scroller?.scrollTo({
      top: scroller.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [isOpen, messages, error, isLoading]);

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

  useEffect(() => () => abortRef.current?.abort(), []);

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
    inputRef.current?.focus();
  }

  async function submitMessage(value: string, retry = false) {
    const text = value.trim();
    if (!text || pendingRef.current) return;
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoing.slice(-20) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many requests right now. Please wait a moment and retry.");
        if (response.status === 400 || response.status === 413) throw new Error("This message or conversation is too long. Start a new chat and try a shorter question.");
        throw new Error("The assistant is temporarily unavailable. Please retry in a moment.");
      }
      const data = await response.json();
      if (typeof data.text !== "string" || !data.text.trim()) throw new Error("No answer came back. Please retry.");
      if (requestRef.current === requestId) setMessages([...outgoing, { role: "model", content: data.text.trim() }]);
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
          className="mb-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border-primary bg-white text-text-primary shadow-[0_24px_80px_rgba(0,0,0,0.22)] dark:bg-[#1a1a1c] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:mb-4"
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

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
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
            {isLoading && <div role="status" className="flex items-center gap-2 text-sm text-text-secondary"><span className="size-2 animate-pulse rounded-full bg-purple-primary motion-reduce:animate-none" aria-hidden="true" />Finding an answer...</div>}
            {error && <div role="alert" className="rounded-2xl border border-border-primary bg-bg-primary p-3 text-sm leading-5 text-text-primary">
              <p>{error}</p>
              <button type="button" onClick={() => submitMessage(messages[messages.length - 1]?.content ?? "", true)} className="mt-2 inline-flex min-h-9 items-center gap-2 font-medium text-purple-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-primary"><RotateCcw size={14} aria-hidden="true" />Retry question</button>
            </div>}
          </div>

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
      <button ref={toggleRef} type="button" onClick={openChat} aria-label="Toggle chat" aria-expanded={isOpen} aria-controls="portfolio-chat-panel" className="flex min-h-14 items-center gap-2 rounded-full border border-border-primary bg-text-primary px-4 text-sm font-medium text-bg-primary shadow-lg transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary">
        <MessageCircle size={19} aria-hidden="true" />
        <span>Ask Haris AI</span>
      </button>
    </div>
  );
}
