import Image from "next/image";
import Link from "next/link";
import { siteMetadata } from "@/app/data/siteMetadata";
import { fetchAndSortBlogPosts } from "@/app/lib/utils";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Test Page — Reference Home Recreation",
  description: "Sandbox page for previewing reference-style designs before applying them to real pages.",
  robots: { index: false, follow: false },
};

/* ────────────────────────────────────────────────────────────────────
   TEST PAGE — reference homepage recreation with our data.
   Temporary sandbox: preview here, approve changes, then apply to the
   real pages. Delete this file + the footer link when done.
   ──────────────────────────────────────────────────────────────────── */

const IS = "[font-family:var(--font-instrument-serif),serif]";

/* ---------- small helpers ---------- */

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs font-normal uppercase tracking-widest text-black/80 dark:text-white/70">
      {children}
    </p>
  );
}

function SectionHeader({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="mb-12 text-center">
      <Kicker>{kicker}</Kicker>
      <h2
        className={`mt-2 text-5xl font-medium leading-none tracking-tight text-black dark:text-white md:text-6xl md:tracking-[-1.5px] ${IS} [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px]`}
      >
        {children}
      </h2>
    </div>
  );
}

function GradientWord({ children }: { children: ReactNode }) {
  return (
    <span
      className="animate-gradient-x text-colorfull px-1 italic [text-shadow:none]"
      style={{
        maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
        maskSize: "200% 100%",
        maskPosition: "left center",
        maskRepeat: "no-repeat",
      }}
    >
      {children}
    </span>
  );
}

function DoubleArrow() {
  return (
    <span className="relative ml-2 inline-flex size-4 items-center overflow-hidden">
      <span className="absolute -translate-x-4 transition-transform duration-300 group-hover:translate-x-0">→</span>
      <span className="absolute translate-x-0 transition-transform duration-300 group-hover:translate-x-4">→</span>
    </span>
  );
}

/* ---------- data (ours) ---------- */

const heroTiles = [
  { tag: "NOW", dot: "bg-green-500", title: "BSIT Graduate", sub: "UoM · Top 15% NSCT", href: "/about" },
  { tag: "BUILDING", dot: "bg-orange-500", title: "The Workshop", sub: "Apps, security, AI", href: "/projects" },
  { tag: "WRITING", dot: "bg-blue-500", title: "Engineering reads", sub: "Process & patterns", href: "/blog" },
];

const stackRows = [
  ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Node.js", "Express", "PostgreSQL", "MongoDB", "Supabase", "WebSockets", "Redis"],
  ["Kali Linux", "Wireshark", "Burp Suite", "Metasploit", "OWASP", "TryHackMe", "Docker", "Git", "FastAPI", "Suricata 7", "Scapy", "Terraform"],
  ["Python", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "OpenAI", "Claude", "Gemini", "LangChain", "pgvector", "Keras"],
];

const timezoneCities = ["LAHORE", "LONDON", "NEW YORK", "DUBAI", "TOKYO", "SYDNEY", "SAN FRANCISCO"];

const caseStudies = [
  { slug: "intrushield-nids", name: "IntruShield NIDS", line: "An enterprise-grade SOC platform with real-time intrusion detection, Suricata 7 DPI, and FastAPI.", img: "/blog/intrushield.png" },
  { slug: "medicalink-hms", name: "MedicaLink-HMS", line: "Hospital management SaaS on the MERN stack with AI integration and real-time WebSockets.", img: "/blog/medicalink.png" },
  { slug: "packetvision-network-sniffer", name: "PacketVision", line: "High-performance network packet inspection engine using Python and Scapy.", img: "/blog/packetvision.png" },
];

const testimonials = [
  { g: "radial-gradient(94.21% 78.4% at 50% 29.91%, rgba(39,61,180,0.7), rgba(15,9,38,0.4))", head: "He cut our API response times by 99%.", body: "Our booking search took seconds; after Haris rebuilt the query layer and caching it felt instant. He documented every change so our team could maintain it after handover.", name: "Sarah Mitchell", role: "Product Manager, Travel Tech" },
  { g: "radial-gradient(84.35% 70.19% at 50% 38.11%, rgba(2,96,101,0.57), rgba(5,136,178,0.06))", head: "Security was the architecture, not an afterthought.", body: "Haris designed our auth flows, RBAC and data model with OWASP protections from day one. When we ran an external review, nothing critical came back.", name: "Imran Baig", role: "CTO, Fintech Startup" },
  { g: "radial-gradient(86.88% 75.47% at 50% 24.53%, rgba(82,48,145,0.7), rgba(26,11,51,0.14))", head: "Our platform finally feels enterprise-grade.", body: "From multi-role portals to real-time status updates, everything he shipped just worked. Clear estimates, honest weekly updates, zero surprises.", name: "Adeel Khan", role: "Project Lead, Health-Tech" },
  { g: "radial-gradient(94.21% 78.4% at 50% 29.91%, rgba(39,61,180,0.7), rgba(15,9,38,0.4))", head: "Exceptional problem-solving and execution.", body: "Haris combined full-stack development, AI integration, and cybersecurity with a strong problem-solving mindset — polished, practical solutions.", name: "Michael John", role: "CTO, All Safe" },
  { g: "radial-gradient(84.35% 70.19% at 50% 38.11%, rgba(2,96,101,0.57), rgba(5,136,178,0.06))", head: "Strong technical execution.", body: "Muhammad delivered a polished solution with strong attention to detail. His full-stack, AI, and security skills turned the idea into a reliable product.", name: "M. Haris", role: "Founder @ Altron" },
];

const faqs = [
  { q: "What kind of work are you available for?", a: "Full-time roles and freelance projects across web development, cybersecurity, and AI/ML — remote from Pakistan, shipping across every timezone." },
  { q: "How do you approach security in your builds?", a: "Security is the architecture, not an afterthought: OWASP Top 10 mitigations, JWT auth in HTTP-only cookies, RBAC, and zero-trust defaults from the first commit." },
  { q: "What does your typical stack look like?", a: "MERN and Next.js on the web side, Suricata/Wazuh/FastAPI for security tooling, and Python with TensorFlow/LangChain for AI work — all glued together with TypeScript and Supabase." },
  { q: "How fast do you reply?", a: "Usually within 24 hours. Email itsharis.tech@gmail.com or use the contact page to book a call." },
];

/* ---------- page ---------- */

export default async function TestPage() {
  const posts = (await fetchAndSortBlogPosts()).slice(0, 3);

  return (
    <div className="relative min-w-0 bg-[#F4F4F4] text-neutral-900 dark:bg-[rgb(13,13,15)] dark:text-white">
      {/* marquee keyframes (scoped to this test page) */}
      <style>{`
        @keyframes tp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes tp-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes tp-spin { to { transform: rotate(360deg); } }
        .tp-row { display: flex; gap: 8px; width: max-content; animation: tp-marquee 30s linear infinite; }
        .tp-row-r { animation-name: tp-marquee-r; }
        .tp-testi { display: flex; width: max-content; animation: tp-marquee 60s linear infinite; }
        .tp-testi:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .tp-row, .tp-testi { animation: none; } }
      `}</style>

      {/* Hatched frame rails — 12px mobile / 32px desktop */}
      {["left-0 border-r", "right-0 border-l"].map((side) => (
        <div
          key={side}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 ${side} z-10 hidden w-3 border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.06)_0px,rgba(0,0,0,0.06)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_7px)]`}
        />
      ))}

      {/* ══ HERO ══ */}
      <section className="relative isolate flex min-h-svh flex-col justify-center px-5 pt-24 pb-8 sm:px-10 lg:px-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr]">
          {/* Left */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <h1 className={`text-6xl leading-[0.95] text-neutral-900 dark:text-white sm:text-7xl lg:text-8xl ${IS}`}>
                Full stack
                <br />
                <GradientWord>engineer</GradientWord>
              </h1>
              <p className="mt-5 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-white/60">
                Remote from Pakistan · Web, Security &amp; AI
              </p>
            </div>
            {/* Tilted photo strip */}
            <div className="flex items-end gap-0">
              {["rotate-[-6deg]", "rotate-[3deg] -ml-6", "rotate-[-2deg] -ml-6", "rotate-[5deg] -ml-6"].map((r, i) => (
                <div key={i} className={`relative aspect-[4/5] w-28 overflow-hidden rounded-xl border border-black/10 shadow-xl transition-transform duration-300 hover:z-10 hover:scale-105 dark:border-white/10 sm:w-36 ${r}`}>
                  <Image src={siteMetadata.avatarImage} alt="Muhammad Haris" fill sizes="160px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col items-start justify-between gap-10 lg:items-end lg:text-right">
            <Link href="/projects/intrushield-nids" className="group">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-white/60 lg:justify-end">
                <span className="size-1.5 rounded-full bg-blue-500" />
                New launch
                <span aria-hidden className="hidden h-px w-10 bg-blue-500/50 lg:block" />
              </p>
              <p className={`mt-2 text-3xl text-neutral-900 dark:text-white ${IS}`}>IntruShield NIDS</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-400 dark:text-white/40 lg:justify-end">
                Smart. Secure. Scalable.
                <span className="inline-flex size-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:border-white/20 dark:text-white/60">↗</span>
              </p>
            </Link>
            <div>
              <p className={`text-2xl text-neutral-500 dark:text-white/60 sm:text-3xl ${IS}`}>
                Secure by design.
                <br />
                Built to scale.
              </p>
              <p className={`mt-6 text-6xl leading-[0.95] text-neutral-900 [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] dark:text-white sm:text-7xl lg:text-8xl ${IS}`}>
                Muhammad
                <br />
                Haris
              </p>
            </div>
          </div>
        </div>

        {/* Bottom status tiles */}
        <div className="mx-auto mt-14 grid w-full max-w-6xl grid-cols-1 border-t border-neutral-200 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {heroTiles.map((t) => (
            <Link key={t.tag} href={t.href} className="group border-b border-neutral-200 p-5 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03] sm:border-r">
              <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-white/50">
                <span className="flex items-center gap-2"><span className={`size-2 rounded-sm ${t.dot}`} />{t.tag}</span>
                <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </p>
              <p className="mt-3 text-lg font-medium text-neutral-900 dark:text-white">{t.title}</p>
              <p className="text-sm text-neutral-500 dark:text-white/50">{t.sub}</p>
            </Link>
          ))}
          <div className="border-b border-neutral-200 p-5 dark:border-white/10">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-white/50">
              <span className="size-2 rounded-sm bg-red-500" />
              Reach out
            </p>
            <Link href="/contact" className="group mt-3 flex w-full items-center justify-between rounded-full bg-neutral-900 py-2.5 pl-5 pr-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/85">
              Start a conversation
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5 dark:bg-black/10">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BENTO ROW ══ */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 px-5 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
        {/* Let's build together */}
        <Link href="/contact" className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
          <span className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:border-white/15 dark:text-white/50">↗</span>
          <p className="text-base font-semibold text-neutral-900 dark:text-white">Let&apos;s Build Together</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-white/50">Clear communication, fast iterations, no surprises</p>
        </Link>

        {/* Tech stack marquee */}
        <Link href="/about" className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] sm:col-span-2">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-5 space-y-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            {stackRows.map((row, i) => (
              <div key={i} className={`tp-row ${i === 1 ? "tp-row-r" : ""}`} style={{ animationDuration: `${28 + i * 6}s` }}>
                {[...row, ...row].map((t, j) => (
                  <span key={j} className="whitespace-nowrap rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="relative text-base font-semibold text-neutral-900 dark:text-white">Tech Stack</p>
          <p className="relative mt-1 text-sm text-neutral-500 dark:text-white/50">The stack behind everything I ship</p>
        </Link>

        {/* Timezones */}
        <Link href="/contact" className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
          <div aria-hidden className="pointer-events-none absolute inset-x-5 top-5 space-y-1.5">
            {timezoneCities.slice(0, 5).map((c, i) => (
              <p key={c} className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-300 dark:text-white/20" style={{ opacity: 1 - i * 0.15 }}>{c}</p>
            ))}
          </div>
          <p className="relative text-base font-semibold text-neutral-900 dark:text-white">Flexible With Timezones</p>
          <p className="relative mt-1 text-sm text-neutral-500 dark:text-white/50">Based in Pakistan, available globally</p>
        </Link>

        {/* What you get */}
        <Link href="/projects" className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
          <div aria-hidden className="absolute left-5 top-5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Meets Deadlines</p>
            <p className="text-[11px] text-neutral-500 dark:text-white/50">Scoped, estimated, on time</p>
          </div>
          <p className="text-base font-semibold text-neutral-900 dark:text-white">What You Get</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-white/50">Clean code, pixel-perfect UI, deployed &amp; scaling</p>
        </Link>

        {/* Stats */}
        <Link href="/stats" className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] lg:col-span-3">
          <div aria-hidden className="pointer-events-none absolute inset-x-5 top-8 flex items-end gap-2 opacity-40">
            {[30, 55, 40, 70, 52, 85, 66, 95, 74, 100, 88].map((h, i) => (
              <span key={i} className="w-full rounded-t bg-blue-500/60" style={{ height: `${h * 0.7}px` }} />
            ))}
          </div>
          <p className="relative text-base font-semibold text-neutral-900 dark:text-white">Live Stats</p>
          <p className="relative mt-1 text-sm text-neutral-500 dark:text-white/50">Views, write-ups &amp; site metrics — straight from the database</p>
        </Link>
      </section>

      {/* ══ CASE STUDIES ══ */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-10 lg:px-16">
        <SectionHeader kicker="Case studies">
          Curated <GradientWord>work</GradientWord>
        </SectionHeader>
        <div className="space-y-6">
          {caseStudies.map((p) => (
            <Link key={p.slug} href={`/projects/${p.slug}`} className="group block overflow-hidden rounded-3xl border border-neutral-200 bg-white p-2.5 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                <h3 className={`max-w-2xl text-xl text-neutral-900 dark:text-white sm:text-2xl ${IS}`}>{p.line}</h3>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:border-white/15 dark:text-white/50">↗</span>
              </div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-white/[0.04] sm:aspect-[16/7]">
                <Image src={optimizeImageUrl(p.img, 1400)} alt={p.name} fill sizes="(max-width:1024px) 100vw, 1024px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/projects" className="group inline-flex items-center font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-white/50 dark:hover:text-white">
            See more projects
            <DoubleArrow />
          </Link>
        </div>
      </section>

      {/* ══ FROM THE DESK (blog) ══ */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-10 lg:px-16">
        <SectionHeader kicker="From the desk">
          Thoughts &amp; <GradientWord>writings</GradientWord>
        </SectionHeader>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col rounded-[22px] p-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.09)] transition-all duration-300 hover:bg-neutral-50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.09)] dark:hover:bg-white/[0.04]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-white/[0.04]">
                {post.imageName && (
                  <Image
                    src={optimizeImageUrl(post.imageName.startsWith("http") || post.imageName.startsWith("/") ? post.imageName : `/blog/${post.imageName}`, 800)}
                    alt={post.title}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div aria-hidden className="absolute inset-0 bg-black/25" />
              </div>
              <div className="flex flex-1 flex-col gap-2 px-2 pb-1.5 pt-4">
                <h3 className="text-lg font-semibold leading-snug text-neutral-900 dark:text-white">{post.title}</h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{post.summary}</p>
                <div className="mt-auto flex items-center justify-between pt-3 text-sm text-neutral-500 dark:text-white/50">
                  <span>Read article</span>
                  <span className="relative flex size-[25px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 dark:border-white/20">
                    <span className="absolute -translate-x-5 transition-transform duration-500 group-hover:translate-x-0">→</span>
                    <span className="absolute translate-x-0 transition-transform duration-500 group-hover:translate-x-5">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/blog" className="group inline-flex items-center font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-white/50 dark:hover:text-white">
            Read more posts
            <DoubleArrow />
          </Link>
        </div>
      </section>

      {/* ══ KNOW ABOUT ME ══ */}
      <section className="mx-auto w-full max-w-6xl border-y border-dashed border-neutral-200 px-5 py-16 dark:border-white/10 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Kicker>Know about me</Kicker>
            <h2 className={`mt-2 text-4xl leading-tight text-neutral-900 dark:text-white sm:text-5xl ${IS}`}>
              Full-Stack Developer and a little bit of <GradientWord>everything</GradientWord>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p>
                I&apos;m Muhammad Haris, a BSIT graduate working across three domains: web development,
                cybersecurity, and AI/ML. I build full-stack apps with MERN and Next.js — and I secure
                them from day one with OWASP protections, JWT + RBAC auth, and zero-trust defaults.
              </p>
              <p>
                The results back it up: Top 15% nationally in Pakistan&apos;s NSCT among 33,000+ graduates,
                96% in Cybersecurity coursework, and hands-on SOC experience with Wazuh SIEM.
              </p>
              <p>I believe in waking up each day eager to make a difference!</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-5">
              {[
                { label: "LinkedIn", href: siteMetadata.linkedin },
                { label: "GitHub", href: siteMetadata.github },
                { label: "X", href: siteMetadata.twitter },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline dark:text-white">
                  {s.label}
                  <span className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                </a>
              ))}
            </div>
            <Link href="/about" className="group mt-8 inline-flex items-center font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-white/50 dark:hover:text-white">
              Work experience
              <DoubleArrow />
            </Link>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10">
            <Image src={siteMetadata.avatarImage} alt="Muhammad Haris" fill sizes="400px" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS (marquee) ══ */}
      <section className="w-full overflow-hidden py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-10 lg:px-16">
          <SectionHeader kicker="Testimonials">
            Word on the street <GradientWord>about me</GradientWord>
          </SectionHeader>
        </div>
        <div className="[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="tp-testi">
            {[...testimonials, ...testimonials].map((t, i) => (
              <article key={i} className="mx-1 flex w-[300px] select-none flex-col justify-between overflow-hidden rounded-xl bg-black p-4 text-white antialiased shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:mx-2 md:w-[340px] md:rounded-2xl" style={{ backgroundImage: t.g }}>
                <blockquote>
                  <p className="text-sm font-semibold leading-relaxed">{t.head}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{t.body}</p>
                </blockquote>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
                    {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <p className="text-white/60">{t.role}</p>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6">
        <SectionHeader kicker="Questions">
          Frequently asked, <GradientWord>answered</GradientWord>
        </SectionHeader>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.q} name="test-faq" className="group rounded-xl transition-colors open:bg-white/50 dark:open:bg-neutral-800/[0.14]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium leading-snug text-neutral-800 dark:text-neutral-200 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-500 transition-all duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </summary>
              <p className="px-5 pb-5 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-2xl py-16 ring-1 ring-neutral-200 dark:ring-white/10">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(59,80,200,0.25),transparent)]" />
          {/* spinning badge */}
          <div className="absolute left-1/2 top-8 -translate-x-1/2 cursor-grab lg:left-auto lg:right-24 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
            <div className="relative size-24 rounded-full bg-blue-700 p-1.5">
              <svg viewBox="0 0 100 100" className="size-full" style={{ animation: "tp-spin 12s linear infinite" }}>
                <defs><path id="tp-circle" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" /></defs>
                <text className="fill-white font-mono text-[10.5px] uppercase tracking-[0.18em]">
                  <textPath href="#tp-circle">Open to work · Open to work ·</textPath>
                </text>
              </svg>
              <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-white lg:block">✦</span>
            </div>
          </div>
          <div className="relative mx-auto flex max-w-2xl flex-col items-center pt-16 text-center lg:pt-0">
            <h3 className="text-2xl tracking-wide text-black dark:text-white lg:text-5xl">
              <span className="font-light">FROM CONCEPT TO </span>
              <span className="font-extrabold">CREATION</span>
            </h3>
            <h3 className="mt-1 text-2xl tracking-wide text-black dark:text-white lg:text-5xl">
              <span className="font-light">LET&apos;S MAKE IT </span>
              <span className="font-extrabold">HAPPEN!</span>
            </h3>
            <Link
              href="/contact"
              className="group relative mt-8 inline-flex scale-110 items-center rounded-full border border-black/30 bg-black/20 py-1 pl-4 pr-1 text-base font-medium text-black transition-transform duration-300 active:scale-[0.98] dark:border-white/30 dark:bg-white/10 dark:text-white md:hover:scale-125"
            >
              Get In Touch
              <span className="ml-3 flex size-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:translate-x-0.5 dark:bg-white dark:text-black">→</span>
            </Link>
            <p className="mt-8 text-sm font-medium text-neutral-700 dark:text-white/80">
              I&apos;m available for full-time roles &amp; freelance projects.
            </p>
            <p className="mt-1 max-w-md text-sm text-neutral-500 dark:text-white/50">
              I build secure, scalable web applications and deliver seamless user experiences.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
