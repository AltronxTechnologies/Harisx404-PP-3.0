import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { SectionHeading } from "./SectionHeading";

type Faq = { q: string; a: string };

// Built-in defaults: shown until the `faqs` table exists (see
// migrations/2026_faqs.sql) or when Supabase isn't configured, so the
// homepage never renders an empty section by accident.
const fallbackFaqs: Faq[] = [
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

/** Admin-managed FAQ data + section switch, resolved server-side (ISR). */
async function getFaqData(): Promise<{ hidden: boolean; faqs: Faq[] }> {
  const supabase = getPublicSupabase();
  if (!supabase) return { hidden: false, faqs: fallbackFaqs };

  try {
    const [settingRes, faqsRes] = await Promise.all([
      // Single-row settings table with named columns; the boolean column
      // is added by migrations/2026_faqs.sql (missing column = visible).
      supabase.from("site_settings").select("show_faq_section").limit(1).maybeSingle(),
      supabase
        .from("faqs")
        .select("question, answer, display_order, created_at")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    // Section switch: hide only on an explicit false.
    if (settingRes.data?.show_faq_section === false) return { hidden: true, faqs: [] };

    // Table missing (migration not applied yet) → keep the defaults.
    if (faqsRes.error) return { hidden: false, faqs: fallbackFaqs };

    // Table exists: the admin list is the source of truth. If every
    // question is hidden or deleted, hide the whole section too.
    const faqs = (faqsRes.data ?? []).map((row) => ({ q: row.question, a: row.answer }));
    return { hidden: faqs.length === 0, faqs };
  } catch {
    return { hidden: false, faqs: fallbackFaqs };
  }
}

export async function HomeFaq() {
  const { hidden, faqs } = await getFaqData();
  if (hidden) return null;

  return (
    <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-2 sm:px-4">
      <SectionHeading kicker="FAQs" className="mb-14" headingId="faq-heading">
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
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-500 transition-all duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180 motion-reduce:transition-none motion-reduce:group-open:rotate-0 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
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
            {/* whitespace-pre-line keeps admin-entered line breaks */}
            <p className="whitespace-pre-line px-5 pb-5 text-[15px] leading-relaxed text-text-secondary">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
