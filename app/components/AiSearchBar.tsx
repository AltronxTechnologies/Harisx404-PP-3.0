"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type BlogPost = {
  id: string;
  title: string;
  /** New API shape: full link + type. Legacy shape: slug only. */
  link?: string;
  type?: "blog" | "project";
  slug?: string;
  summary?: string;
  published_at?: string;
  similarity?: number;
};

export function AiSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), match_count: 5, similarity_threshold: 0.3 })
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 px-2 sm:px-4">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink-secondary group-focus-within:text-accent-signal transition-colors">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") {
              setHasSearched(false);
              setResults([]);
            }
          }}
          placeholder="Semantic search: 'How to build an AI app' or 'NextJS authentication'..."
          className="w-full bg-surface-raised border border-border-hairline rounded-full pl-12 pr-24 py-4 text-base hover:border-neutral-400/70 active:border-neutral-400/70 focus:outline-none focus:ring-2 focus:ring-accent-signal/50 shadow-sm transition-all dark:hover:border-white/25 dark:active:border-white/25"
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute inset-y-2 right-2 px-6 bg-accent-signal text-white rounded-full font-medium hover:bg-accent-signal/90 disabled:opacity-50 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results Dropdown */}
      {hasSearched && (
        <div className="mt-4 bg-surface-raised border border-border-hairline rounded-2xl shadow-xl overflow-hidden divide-y divide-border-hairline">
          {isLoading ? (
            <div className="p-8 text-center text-ink-secondary flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent-signal mx-auto" />
              <p>Analyzing semantic meaning...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((post, idx) => {
              const href = post.link ?? (post.slug ? `/blog/${post.slug}` : "#");
              return (
              <Link key={href !== "#" ? href : `result-${idx}`} href={href} className="block p-4 hover:bg-surface-base transition-colors group/result">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-primary group-hover/result:text-accent-signal transition-colors truncate">{post.title}</h3>
                    <p className="text-sm text-ink-secondary line-clamp-2 mt-1">{post.summary}</p>
                    <div className="mt-2 text-xs text-accent-signal/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {/* Note: In a real app we might show match percentage, but omitting for now to keep UI clean */}
                      Semantic Match
                    </div>
                  </div>
                </div>
              </Link>
              );
            })
          ) : (
            <div className="p-8 text-center text-ink-secondary">
              No semantically similar posts found. Try different keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
