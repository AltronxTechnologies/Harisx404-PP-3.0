import { SectionHeading } from "./SectionHeading";

const faqs = [
  {
    q: "What kind of work are you available for?",
    a: "Full-time roles and freelance projects across web development, cybersecurity, and AI/ML — remote from Pakistan, shipping across every timezone.",
  },
  {
    q: "How do you approach security in your builds?",
    a: "Security is the architecture, not an afterthought: OWASP Top 10 mitigations, JWT auth in HTTP-only cookies, RBAC, and zero-trust defaults from the first commit.",
  },
  {
    q: "What does your typical stack look like?",
    a: "MERN and Next.js on the web side, Suricata/Wazuh/FastAPI for security tooling, and Python with TensorFlow/LangChain for AI work — all glued together with TypeScript and Supabase.",
  },
  {
    q: "How fast do you reply?",
    a: "Usually within 24 hours. Email itsharis.tech@gmail.com or use the contact page to book a call.",
  },
];

export function HomeFaq() {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-2 sm:px-4">
      <SectionHeading kicker="FAQ's" className="mb-14">
        Frequently asked,{" "}
        <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
          questions
        </span>
      </SectionHeading>
      <div className="space-y-2">
        {faqs.map((f) => (
          <details
            key={f.q}
            name="home-faq"
            className="group rounded-xl transition-colors open:bg-white/50 dark:open:bg-neutral-800/[0.14]"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium leading-snug text-text-secondary transition-colors duration-300 hover:text-text-primary group-open:text-text-primary [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-500 transition-all duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
              <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="px-5 pb-5 text-[14px] leading-relaxed text-text-secondary">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
