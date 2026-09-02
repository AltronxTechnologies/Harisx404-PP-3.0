import type { ReactNode } from "react";
import Link from "next/link";

interface BentoCardProps {
  children: ReactNode;
  height?: string;
  className?: string;
  showHoverGradient?: boolean;
  hideOverflow?: boolean;
  linkTo?: string;
}

export function BentoCard({
  children,
  height = "h-auto",
  className = "",
  showHoverGradient = true,
  hideOverflow = true,
  linkTo,
}: BentoCardProps) {
  const cardContent = (
    <div
      className={`card-light-edge group relative flex flex-col rounded-2xl border border-border-primary bg-bg-primary p-6 transition-all duration-300 hover:bg-white motion-reduce:transition-none dark:hover:bg-white/[0.04] ${
        hideOverflow ? "overflow-hidden" : ""
      } ${height} ${className}`}
    >
      {linkTo && (
        <div className="absolute bottom-3.5 right-3.5 z-[999] flex h-7 w-7 rotate-6 items-center justify-center rounded-full bg-neutral-200 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-[-6px] group-hover:rotate-0 group-hover:opacity-100 motion-reduce:transition-none dark:bg-white/10">
          <svg
            className="h-4 w-4 text-neutral-600 dark:text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.25 15.25V6.75H8.75"
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 7L6.75 17.25"
            />
          </svg>
        </div>
      )}
      {showHoverGradient && (
        <div className="pointer-events-none absolute inset-0 z-30 select-none bg-gradient-to-tl from-neutral-400/10 via-transparent to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 motion-reduce:transition-none dark:from-white/[0.05]" />
      )}
      {children}
    </div>
  );

  if (linkTo) {
    return linkTo.startsWith("/") ? (
      <Link href={linkTo} className="block h-full">
        {cardContent}
      </Link>
    ) : (
      <a
        href={linkTo}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
