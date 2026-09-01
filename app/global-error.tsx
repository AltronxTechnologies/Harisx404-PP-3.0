"use client";

import { useEffect } from "react";
import { logger } from "./lib/logger";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our internal Supabase logger
    logger.fatal("Global unhandled exception", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html className="dark">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary p-6 text-center text-text-primary">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-text-secondary">
            Error
          </p>
          <h2 className="mb-4 font-display text-4xl text-text-primary">
            Something went critically wrong
          </h2>
          <p className="mb-8 max-w-md text-text-secondary">
            Our team has been notified. Please try refreshing.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-full bg-text-primary px-6 py-3 text-sm font-medium text-bg-primary shadow-lg transition-all hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
