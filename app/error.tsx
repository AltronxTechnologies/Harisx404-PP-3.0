"use client";

import { useEffect } from "react";
import { logger } from "./lib/logger";
import { ThemeProvider } from "next-themes";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our internal Supabase logger
    logger.error("UI React Exception", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary text-text-primary p-6 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
          Error
        </p>
        <h2 className="mb-4 font-display text-4xl text-text-primary md:text-5xl">
          Something went <em className="text-gradient-accent italic">wrong</em>
        </h2>
        <p className="mb-8 max-w-md text-base text-text-secondary">
          We encountered an unexpected error. Our system has automatically logged the issue.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="rounded-full bg-text-primary px-6 py-3 text-sm font-medium text-bg-primary shadow-lg transition-all hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-border-primary bg-bg-primary px-6 py-3 text-sm font-medium text-text-primary transition-all hover:border-text-tertiary hover:shadow-lg"
          >
            Go back home
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
}
