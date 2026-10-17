"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function AdaptiveCardCopy({
  title,
  summary,
  featured = false,
}: {
  title: string;
  summary: string;
  featured?: boolean;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleLines, setTitleLines] = useState(1);

  useLayoutEffect(() => {
    const titleElement = titleRef.current;
    if (!titleElement) return;
    let active = true;

    const measure = () => {
      if (!active) return;
      const lineHeight = Number.parseFloat(getComputedStyle(titleElement).lineHeight);
      if (!lineHeight) return;
      setTitleLines(Math.min(2, Math.max(1, Math.round(titleElement.scrollHeight / lineHeight))));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(titleElement);
    document.fonts?.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [title]);

  return (
    <div className={`overflow-hidden ${featured ? "h-[142px] md:h-[150px] xl:h-[166px]" : "h-[142px]"}`}>
      <h3
        ref={titleRef}
        className={`mt-3 line-clamp-2 text-balance font-display font-medium text-text-primary ${featured ? "xl:mt-2" : ""} ${
          featured
            ? "text-2xl leading-7 md:text-[26px] md:leading-8"
            : "text-2xl leading-7"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-[15px] leading-[22px] text-text-secondary ${featured ? "xl:mt-[6px]" : ""} ${
          titleLines === 1 ? "line-clamp-4" : "line-clamp-3"
        } ${featured ? "xl:line-clamp-4" : ""}`}
      >
        {summary}
      </p>
    </div>
  );
}
