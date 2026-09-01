"use client";

import React, { useState, useRef, useEffect } from "react";

interface DetailsProps {
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface DetailsSummaryProps {
  children: React.ReactNode;
}

export function DetailsSummary({ children }: DetailsSummaryProps) {
  return <>{children}</>;
}

export function Details({
  summary,
  children,
  defaultOpen = false,
}: DetailsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Separate DetailsSummary from other children
  const childrenArray = React.Children.toArray(children);
  const summaryChild = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === DetailsSummary,
  ) as React.ReactElement | undefined;
  const contentChildren = childrenArray.filter(
    (child) => !React.isValidElement(child) || child.type !== DetailsSummary,
  );

  // Use either the summary prop or the DetailsSummary child
  const summaryContent = summaryChild ? summaryChild.props.children : summary;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <details
      className="group relative mb-4 overflow-hidden rounded-xl border border-border-primary/60 bg-transparent transition-colors duration-300 hover:bg-black/[0.02] focus-within:ring-2 focus-within:ring-blue-500/20 open:border-border-primary dark:hover:bg-white/[0.02]"
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className="relative flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium leading-[1.375] text-neutral-800 dark:text-neutral-200 [&::-webkit-details-marker]:hidden"
        aria-expanded={isOpen}
      >
        <span className="flex-1">{summaryContent}</span>

        {/* Rotating chevron — reference: 180° over 300ms cubic-bezier(0.23,1,0.32,1) */}
        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center text-neutral-400 dark:text-neutral-500">
          <svg
            className="size-4"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </summary>

      <div
        ref={contentRef}
        className="relative overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
        role="region"
        aria-label="Expandable content"
      >
        <div className="px-5 pb-5 pt-0 text-[14px] leading-[1.625] text-text-secondary [&>pre:last-child]:mb-0 [&>*:last-child>pre:last-child]:mb-0">
          {contentChildren}
        </div>
      </div>
    </details>
  );
}
