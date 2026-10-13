const concepts = [
  { number: "1", name: "Aero", description: "Soft ceramic shell, calm blue visor." },
  { number: "2", name: "Prism", description: "A luminous, orbiting AI presence." },
  { number: "3", name: "Vector", description: "Precision-built metallic companion." },
];

function ConceptIcon({ number }: { number: string }) {
  if (number === "1") return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Aero ceramic robot with a curved visor" className="preview-float size-16 sm:size-28">
      <defs>
        <linearGradient id="aero-shell" x1="16" y1="10" x2="83" y2="91" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset=".5" stopColor="#d9d9e9" /><stop offset="1" stopColor="#8580a1" /></linearGradient>
        <linearGradient id="aero-face" x1="24" y1="37" x2="81" y2="76" gradientUnits="userSpaceOnUse"><stop stopColor="#253657" /><stop offset="1" stopColor="#080f25" /></linearGradient>
        <linearGradient id="aero-light" x1="31" y1="49" x2="69" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor="#a9f6fa" /><stop offset="1" stopColor="#659dee" /></linearGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="24" ry="4" fill="#6d5e9f" opacity=".22" />
      <path d="M17 44C17 24 29 13 50 13s33 11 33 31v20c0 16-12 25-33 25S17 80 17 64V44Z" fill="url(#aero-shell)" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />
      <path d="M22 36c5-12 15-18 27-18" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 47c0-10 8-16 18-16h16c10 0 18 6 18 16v12c0 10-8 17-18 17H42c-10 0-18-7-18-17V47Z" fill="url(#aero-face)" />
      <path d="M30 40c5-5 11-6 21-6" fill="none" stroke="#fff" strokeOpacity=".17" strokeWidth="2" strokeLinecap="round" />
      <g className="preview-blink" fill="url(#aero-light)"><rect x="32" y="49" width="13" height="9" rx="4.5" /><rect x="55" y="49" width="13" height="9" rx="4.5" /></g>
      <path d="M44 66c4 2 8 2 12 0" fill="none" stroke="#84c9e9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="53" r="4" fill="#aaa6c8" /><circle cx="84" cy="53" r="4" fill="#aaa6c8" />
    </svg>
  );

  if (number === "2") return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Prism holographic assistant with orbiting light" className="preview-float size-16 sm:size-28">
      <defs>
        <linearGradient id="prism-core" x1="22" y1="17" x2="79" y2="81" gradientUnits="userSpaceOnUse"><stop stopColor="#9b8af5" /><stop offset=".55" stopColor="#6044c2" /><stop offset="1" stopColor="#26225d" /></linearGradient>
        <linearGradient id="prism-glass" x1="31" y1="30" x2="68" y2="69" gradientUnits="userSpaceOnUse"><stop stopColor="#46447b" /><stop offset="1" stopColor="#10132f" /></linearGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="23" ry="4" fill="#7254c8" opacity=".2" />
      <ellipse className="preview-orbit" cx="50" cy="52" rx="45" ry="16" fill="none" stroke="#8a71dc" strokeWidth="1.5" opacity=".65" transform="rotate(-27 50 52)" />
      <path d="M50 12 76 26 82 52 69 79 50 88 31 79 18 52 24 26 50 12Z" fill="url(#prism-core)" stroke="#bcabfb" strokeWidth="1.5" />
      <path d="M50 16 73 28 78 51 66 75 50 83 34 75 22 51 27 28 50 16Z" fill="url(#prism-glass)" />
      <path d="M50 17v64M26 30l23 13 25-13M22 51l27-8 29 8M34 75l15-32 17 32" fill="none" stroke="#ab9cf7" strokeOpacity=".28" strokeWidth="1.4" />
      <path d="M35 49c5-5 10-5 15 0 5-5 10-5 15 0" fill="none" stroke="#b7eafc" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="61" r="3" fill="#aff1ff" />
      <circle cx="81" cy="30" r="2.5" fill="#d6c9ff" />
    </svg>
  );

  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Vector brushed-metal robot with amber eyes" className="preview-float size-16 sm:size-28">
      <defs>
        <linearGradient id="vector-shell" x1="17" y1="15" x2="83" y2="89" gradientUnits="userSpaceOnUse"><stop stopColor="#faf8f3" /><stop offset=".4" stopColor="#aab2c1" /><stop offset="1" stopColor="#525c74" /></linearGradient>
        <linearGradient id="vector-face" x1="25" y1="34" x2="73" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#273044" /><stop offset="1" stopColor="#101726" /></linearGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="25" ry="4" fill="#61728c" opacity=".2" />
      <path d="M48 12V6h4v6" fill="none" stroke="#a9b1bf" strokeWidth="3" strokeLinecap="round" /><circle cx="50" cy="6" r="3" fill="#f4b563" />
      <path d="M19 37 26 19 50 13 74 19 81 37v33L69 84H31L19 70V37Z" fill="url(#vector-shell)" stroke="#e8eaf2" strokeWidth="1.5" />
      <path d="M22 39 29 27h42l7 12v24L67 75H33L22 63V39Z" fill="url(#vector-face)" />
      <path d="M25 33h50M27 67l7 8h32l7-8" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />
      <g className="preview-blink" fill="#ffc47d"><path d="M34 47h12l-2 8h-8l-2-8Z" /><path d="M54 47h12l-2 8h-8l-2-8Z" /></g>
      <path d="M43 63h14" stroke="#b2bfd3" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 43h-5v18h5M83 43h5v18h-5" fill="none" stroke="#8893a8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function ChatbotIconConcepts() {
  return (
    <section aria-labelledby="chatbot-concepts-heading" className="mx-auto mt-20 w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-0 lg:px-8">
      <style>{`@keyframes concept-float { 0%, 100% { transform: translateY(0) rotateY(-5deg); } 50% { transform: translateY(-5px) rotateY(5deg); } } @keyframes concept-blink { 0%, 43%, 47%, 100% { transform: scaleY(1); } 45% { transform: scaleY(.12); } } @media (prefers-reduced-motion: no-preference) { #chatbot-icon-options .preview-float { animation: concept-float 5s ease-in-out infinite; } #chatbot-icon-options .preview-blink { animation: concept-blink 5.5s ease-in-out infinite; transform-origin: center; } }`}</style>
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-purple-primary">Assistant concept study</p>
        <h2 id="chatbot-concepts-heading" className="font-display text-4xl leading-tight text-text-primary sm:text-5xl">Choose a character.</h2>
        <p className="max-w-2xl text-sm leading-6 text-text-secondary">Three directions for the chatbot icon. The floating assistant on this page remains unchanged until you pick one.</p>
      </div>
      <div id="chatbot-icon-options" className="grid grid-cols-3 gap-2 sm:gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {concepts.map(({ number, name, description }) => (
          <article key={number} className="min-w-0 rounded-2xl border border-border-primary bg-white p-2.5 dark:bg-white/[0.03] sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium tracking-[0.18em] text-purple-primary">{number}</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-text-secondary sm:block">Icon direction</span>
            </div>
            <div className="my-3 flex h-20 items-center justify-center rounded-xl border border-border-primary bg-bg-primary [perspective:240px] sm:my-5 sm:h-36 sm:rounded-2xl">
              <ConceptIcon number={number} />
            </div>
            <h3 className="font-display text-lg text-text-primary sm:text-3xl">{name}</h3>
            <p className="mt-1 hidden text-sm leading-6 text-text-secondary sm:block">{description}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-secondary">Reply with 1, 2, or 3 to choose the final icon.</p>
    </section>
  );
}
