import type { ReactNode, Ref } from "react";

export function BlogStatePanel({
  kicker,
  title,
  description,
  headingLevel = "h2",
  headingRef,
  headingTabIndex,
  children,
}: {
  kicker: string;
  title: ReactNode;
  description: string;
  headingLevel?: "h1" | "h2";
  headingRef?: Ref<HTMLHeadingElement>;
  headingTabIndex?: number;
  children?: ReactNode;
}) {
  const Heading = headingLevel;

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border-primary bg-white px-6 py-12 text-center shadow-sm dark:bg-white/[0.02] sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
        {kicker}
      </p>
      <Heading
        ref={headingRef}
        tabIndex={headingTabIndex}
        className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary focus:outline-none md:text-[56px] md:tracking-[-1.5px]"
      >
        {title}
      </Heading>
      <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-6 text-text-secondary">
        {description}
      </p>
      {children && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
