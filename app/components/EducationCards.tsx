/**
 * Hand-built visual cards for the two Education panels — replaces photos with
 * on-brand typographic artwork (same 180x270 footprint the ShadowBox frames
 * expect). Deliberately dark in both modes, like small posters, so they read
 * identically on light and dark themes.
 */

function CardShell({
  rotate,
  children,
}: {
  rotate: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute left-0 top-0 flex h-[270px] w-[180px] flex-col justify-between overflow-hidden rounded-lg border border-white/10 bg-[#0b0b10] p-4 shadow dark:border-black/10 dark:bg-[#f4f5f7] ${
        rotate === "left" ? "rotate-[-8deg]" : "rotate-[8deg]"
      }`}
    >
      {/* engineering dot grid, echoing the About hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)] dark:[background-image:radial-gradient(circle,rgba(0,0,0,0.14)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      {children}
    </div>
  );
}

export function BsitCard({ rotate = "left" }: { rotate?: "left" | "right" }) {
  return (
    <CardShell rotate={rotate}>
      {/* circuit-board motif, bottom-left */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-3 -left-3 h-24 w-24 opacity-30"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M10 90H40V60H70V30H90M10 70H30V40H55V15M40 90V75H60V55H85"
          stroke="url(#cc)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="cc" x1="0" y1="100" x2="100" y2="0">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {[
          [40, 60],
          [70, 30],
          [30, 40],
          [55, 15],
          [60, 55],
        ].map(([cx, cy]) => (
          <rect
            key={`${cx}-${cy}`}
            x={cx - 2.5}
            y={cy - 2.5}
            width="5"
            height="5"
            fill="#60a5fa"
          />
        ))}
      </svg>
      <div className="relative flex items-start justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50 dark:text-black/55">
          University of
          <br />
          Malakand
        </p>
        <span className="font-mono text-[11px] text-white/60 dark:text-black/65">&lt;/&gt;</span>
      </div>
      <div className="relative">
        <p className="text-gradient-animated font-display text-6xl leading-none">
          BSIT
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 dark:text-black/70">
          2022 — 2026
        </p>
        <p className="mt-2 truncate font-mono text-[8px] text-white/60 dark:text-black/65">
          ~$ tourmate-malakand --deploy
        </p>
      </div>
      <div className="relative">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["MERN", "C++", "PY", "JS"].map((t) => (
            <span
              key={t}
              className="whitespace-nowrap rounded-full border border-white/15 dark:border-black/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-white/70 dark:text-black/70"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap rounded-full border border-white/15 dark:border-black/15 px-2 py-1 font-mono text-[8px] uppercase tracking-wide text-white/70 dark:text-black/70">
            3.5 / 4.0 CGPA
          </span>
          <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-wide text-white/60 dark:text-black/65">
            FYP Lead
          </span>
        </div>
      </div>
    </CardShell>
  );
}

export function KpitbCard({ rotate = "right" }: { rotate?: "left" | "right" }) {
  return (
    <CardShell rotate={rotate}>
      {/* neural-net motif: 3-4-2 layers */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-3 h-32 w-32 opacity-40"
        viewBox="0 0 110 110"
        fill="none"
      >
        <path
          d="M18 25L52 15M18 25L52 40M18 25L52 65M18 25L52 90M18 55L52 15M18 55L52 40M18 55L52 65M18 55L52 90M18 85L52 15M18 85L52 40M18 85L52 65M18 85L52 90M52 15L90 40M52 40L90 40M52 65L90 40M52 90L90 40M52 15L90 70M52 40L90 70M52 65L90 70M52 90L90 70"
          stroke="url(#nn)"
          strokeWidth="0.8"
        />
        <defs>
          <linearGradient id="nn" x1="0" y1="0" x2="110" y2="110">
            <stop stopColor="#f472b6" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        {[
          [18, 25],
          [18, 55],
          [18, 85],
          [52, 15],
          [52, 40],
          [52, 65],
          [52, 90],
          [90, 40],
          [90, 70],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#a78bfa" />
        ))}
      </svg>
      <p className="relative font-mono text-[9px] uppercase tracking-[0.18em] text-white/50 dark:text-black/55">
        KPITB
        <br />
        Training Program
      </p>
      <div className="relative">
        <p className="text-gradient-animated font-display text-6xl leading-none">
          AI/ML
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 dark:text-black/70">
            Certified
          </span>
          <span
            aria-hidden
            className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#60a5fa]"
          />
        </div>
        <p className="mt-2 truncate font-mono text-[8px] text-white/60 dark:text-black/65">
          &gt; model.fit() · loss ↓ · acc ↑
        </p>
      </div>
      <div className="relative flex flex-wrap gap-1.5">
        {["ML", "DL", "NN", "GenAI"].map((t) => (
          <span
            key={t}
            className="whitespace-nowrap rounded-full border border-white/15 dark:border-black/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-white/70 dark:text-black/70"
          >
            {t}
          </span>
        ))}
      </div>
    </CardShell>
  );
}
