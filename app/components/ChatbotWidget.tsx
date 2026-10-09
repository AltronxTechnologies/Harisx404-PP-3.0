"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hi! I'm Haris's AI assistant. Ask me anything about his projects, skills, or experience!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.slice(-20) }),
      });

      if (response.status === 400 || response.status === 413) {
        setMessages([...newMessages, { role: "model", content: "This conversation is too long. Please refresh to start a new chat." }]);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      
      if (data.text) {
        setMessages([...newMessages, { role: "model", content: data.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: "model", content: "Sorry, I'm having trouble connecting right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[5500] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div id="portfolio-chat-panel" className="mb-4 w-[min(20rem,calc(100vw-3rem))] sm:w-96 h-[500px] max-h-[calc(100vh-120px)] flex flex-col bg-surface-base/90 backdrop-blur-xl border border-border-hairline rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-surface-raised px-4 py-3 flex items-center justify-between border-b border-border-hairline">
            <div className="flex items-center gap-2">
              <div className="bg-accent-signal/20 p-2 rounded-full text-accent-signal">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-medium text-sm">Haris&apos;s AI Assistant</h3>
                <p className="text-xs text-ink-secondary">Powered by Gemini</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => { setIsOpen(false); toggleRef.current?.focus(); }}
              className="text-ink-secondary hover:text-ink-primary p-1 rounded-md hover:bg-surface-base transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-surface-raised border border-border-hairline text-ink-primary" : "bg-accent-signal text-white"}`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${msg.role === "user" ? "bg-surface-raised border border-border-hairline rounded-tr-sm" : "bg-accent-signal/10 text-ink-primary rounded-tl-sm border border-accent-signal/20"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-accent-signal text-white">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-accent-signal/10 rounded-tl-sm border border-accent-signal/20">
                  <Loader2 size={16} className="animate-spin text-accent-signal" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border-hairline bg-surface-raised">
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                aria-label="Ask the portfolio assistant"
                className="w-full bg-surface-base border border-border-hairline rounded-full pl-4 pr-10 py-2 text-sm transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 focus:border-neutral-400/70 focus:outline-none focus:ring-2 focus:ring-accent-signal/50 dark:hover:border-white/25 dark:active:border-white/25 dark:focus:border-white/25"
                disabled={isLoading}
                maxLength={2000}
              />
              <button 
                type="submit" 
                aria-label="Send chat message"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent-signal text-white rounded-full hover:bg-accent-signal/90 disabled:opacity-50 disabled:hover:bg-accent-signal transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-accent-signal hover:bg-accent-signal/90 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle chat"
        aria-expanded={isOpen}
        aria-controls="portfolio-chat-panel"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
