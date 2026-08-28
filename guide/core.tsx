//FILE 3: Starter kit — core shared components (components/core.tsx)
// The two building blocks 80% of the page reuses.
// Fonts assumed via next/font CSS vars: --font-sans, --font-serif, --font-mono, --font-display

export function SectionHeading({ eyebrow, prefix, accent }: {
    eyebrow: string; prefix: string; accent: string;
}) {
    return (
        <h2
            className="relative z-[2] mx-auto mb-24 max-w-xl text-balance text-center font-medium text-5xl tracking-tight md:text-6xl"
            style={{ textShadow: "0 4px 8px rgba(255,255,255,.05), 0 8px 30px rgba(255,255,255,.2)" }}
        >
            <p className="mb-4 font-mono text-xs font-normal uppercase tracking-widest text-white/70">
                {eyebrow}
            </p>
            <span className="inline-block [font-family:var(--font-serif)]">
                {prefix}
                <span className="animate-gradient-x text-colorfull px-1 pb-1 italic">{accent}</span>
            </span>
        </h2>
    );
}

export function BentoCard({ href, eyebrow, description, visual, isLink = true, labelAlign = "text-center" }: {
    href?: string; eyebrow: string; description: string;
    visual: React.ReactNode; isLink?: boolean; labelAlign?: string;
}) {
    const Tag: any = isLink ? "a" : "div";
    return (
        <Tag
            href={href}
            className="group relative flex h-full min-h-72 w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl bg-[var(--card)]/15 ring-1 ring-[var(--border)] transition-colors duration-300 hover:bg-[var(--card)]/5"
        >
            <div className="size-full">{visual}</div>
            <div className={`pointer-events-none z-10 flex w-full flex-col gap-1 p-5 ${labelAlign}`}>
                <p className="font-mono text-xs uppercase text-neutral-400 transition-colors duration-500 group-hover:text-indigo-300">
                    {eyebrow}
                </p>
                <p className="text-lg tracking-wide text-neutral-300 [font-family:var(--font-display)]">
                    {description}
                </p>
            </div>
            {/* hover gradient overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
            {/* arrow chip */}
            {isLink && (
                <div className="absolute bottom-4 right-4 z-20 flex size-9 items-center justify-center rounded-2xl bg-white/10 opacity-0 transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:opacity-100">
                    →
                </div>
            )}
        </Tag>
    );
}

//Next step: tell me which section you want the full code for — navbar, hero, bento, projects, blog, about, testimonials, cta, or footer — and I'll paste it in a copy-ready form adapted for your Next.js project (with placeholder content where your own text/images go). One or two sections per message keeps them complete and usable.