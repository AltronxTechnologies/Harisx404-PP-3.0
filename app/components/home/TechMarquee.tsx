"use client";

function MarqueeRow({ chips, reverse }: { chips: string[]; reverse: boolean }) {
  const doubled = [...chips, ...chips, ...chips];
  return (
    <div className="relative flex min-w-0 max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className={`flex w-max shrink-0 gap-2 pr-2 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } [animation-play-state:running]`}
        style={{ ["--marquee-duration" as string]: "28s" }}
      >
        {doubled.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="whitespace-nowrap rounded-full border border-border-primary px-3 py-1 font-mono text-[11px] text-text-secondary"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TechMarquee({ rows }: { rows: string[][] }) {
  return (
    <div className="min-w-0 space-y-2">
      {rows.map((row, i) => (
        <MarqueeRow key={i} chips={row} reverse={i % 2 === 1} />
      ))}
    </div>
  );
}
