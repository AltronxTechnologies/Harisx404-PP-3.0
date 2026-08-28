import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Run with: node --env-file=.env.local scripts/seed-initial-data.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SETTINGS = [
  { key: 'site_name', value: 'Muhammad Haris | harisx404' },
  { key: 'site_description', value: 'Full-Stack MERN Developer, Cybersecurity & AI Professional, BSIT Graduate.' },
  { key: 'site_url', value: 'https://harisx404.vercel.app' },
  { key: 'author_name', value: 'Muhammad Haris' },
  { key: 'author_email', value: 'harisx404@gmail.com' },
  { key: 'github_url', value: 'https://github.com/harisx404' },
  { key: 'linkedin_url', value: 'https://www.linkedin.com/in/harisx404/' },
  { key: 'twitter_url', value: 'https://twitter.com/harisx404' },
];

const ABOUT_SECTIONS = [
  {
    key: 'bio',
    title: 'Introduction',
    content: "I'm Muhammad Haris (harisx404) — a Full-Stack MERN Developer, Cybersecurity & AI Professional, and BSIT Graduate. I build high-performance, secure, and modern web applications with cutting-edge technologies.",
    display_order: 0,
  },
  {
    key: 'background',
    title: 'Background & Expertise',
    content: "Specialized in scalable full-stack development, network intrusion detection systems, API architectures, and AI model integration. Passionate about building robust software with clean code and high performance.",
    display_order: 1,
  },
  {
    key: 'now',
    title: 'Current Focus',
    content: "Currently engineering modern SaaS platforms, exploring advanced AI agents with Gemini & LangChain, and hardening enterprise cybersecurity defenses.",
    display_order: 2,
  },
];

const TOOLS = [
  { name: "Next.js", category: "Framework", description: "Full-stack React framework with App Router & SSR.", display_order: 0 },
  { name: "React 19 / 18", category: "Frontend", description: "Component-driven UI library for web interfaces.", display_order: 1 },
  { name: "TypeScript", category: "Language", description: "Typed JavaScript for robust, production-grade applications.", display_order: 2 },
  { name: "Tailwind CSS", category: "Styling", description: "Utility-first CSS framework for rapid modern styling.", display_order: 3 },
  { name: "Node.js", category: "Backend", description: "Server-side JavaScript runtime for APIs and microservices.", display_order: 4 },
  { name: "PostgreSQL", category: "Database", description: "Advanced open-source relational database with pgvector.", display_order: 5 },
  { name: "Supabase", category: "Backend / DB", description: "PostgreSQL database, Row Level Security, and Auth.", display_order: 6 },
  { name: "Google Gemini AI", category: "AI / ML", description: "High-speed multimodal LLMs for intelligent assistance.", display_order: 7 },
  { name: "Cloudinary", category: "Media", description: "Cloud media asset hosting, optimization, and CDN delivery.", display_order: 8 },
  { name: "Framer Motion", category: "Motion", description: "Production-ready motion library for fluid React animations.", display_order: 9 },
];

const PROJECTS = [
  {
    title: "IntruShield NIDS",
    slug: "intrushield-nids",
    description: "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    content: "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 0,
    featured: true,
  },
  {
    title: "MedicaLink-HMS",
    slug: "medicalink-hms",
    description: "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    content: "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 1,
    featured: true,
  },
  {
    title: "PacketVision Network Sniffer",
    slug: "packetvision-network-sniffer",
    description: "A high-performance network packet inspection engine using Python and Scapy.",
    content: "A high-performance network packet inspection engine using Python and Scapy.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 2,
    featured: false,
  },
];

// Placeholder testimonials (mirrors app/data/fallback-home.ts)
const TESTIMONIALS = [
  {
    headline: "He shipped in weeks what we scoped for months.",
    quote: "Haris took a vague product brief and turned it into a polished web app faster than we thought possible. Communication was constant and the code was spotless.",
    name: "Amelia Grant",
    role: "Founder, SaaS Startup",
    display_order: 0,
    status: "published",
  },
  {
    headline: "Security-minded from the first commit.",
    quote: "Most developers bolt security on at the end. Haris designed our auth flows and data model with it in mind from day one — our audit passed without a single critical finding.",
    name: "Daniel Okoye",
    role: "CTO, Fintech Platform",
    display_order: 1,
    status: "published",
  },
  {
    headline: "Pixel-perfect, and then some.",
    quote: "Our designers were stunned. Every animation, every breakpoint, every edge case matched the Figma — and he suggested improvements we ended up keeping.",
    name: "Sofia Marques",
    role: "Product Designer",
    display_order: 2,
    status: "published",
  },
  {
    headline: "The rare dev who thinks about the business.",
    quote: "Haris didn't just build features; he questioned the ones that wouldn't move the needle. That saved us weeks of wasted effort and a lot of budget.",
    name: "Ravi Menon",
    role: "Product Manager, E-commerce",
    display_order: 3,
    status: "published",
  },
  {
    headline: "Handled our scale like it was nothing.",
    quote: "We threw a traffic spike at the launch and the realtime dashboard he built didn't blink. Caching, queues, monitoring — all thought through in advance.",
    name: "Hannah Lee",
    role: "Engineering Lead, Analytics Co.",
    display_order: 4,
    status: "published",
  },
  {
    headline: "Would hire again without hesitation.",
    quote: "Clear estimates, honest updates, zero surprises. Working with Haris felt like having a senior engineer embedded in our team from day one.",
    name: "Tomás Rivera",
    role: "Agency Owner",
    display_order: 5,
    status: "published",
  },
];

// Placeholder experience entries (mirrors app/about/page.tsx fallback)
const EXPERIENCE = [
  {
    role: "Freelance Full-Stack Developer",
    company: "Self-employed",
    location: "Remote",
    start_date: "2023",
    end_date: "Present",
    bullets: [
      "Ship end-to-end web apps for clients using Next.js, Node.js, and Supabase.",
      "Own everything from UI polish to deployment, monitoring, and security hardening.",
    ],
    display_order: 0,
    status: "published",
  },
  {
    role: "Web Developer",
    company: "Placeholder Studio",
    location: "Remote",
    start_date: "2021",
    end_date: "2023",
    bullets: [
      "Built and maintained responsive marketing sites and dashboards for placeholder clients.",
      "Introduced TypeScript and component libraries to speed up delivery across projects.",
    ],
    display_order: 1,
    status: "published",
  },
  {
    role: "Junior Developer",
    company: "Placeholder Labs",
    location: "On-site",
    start_date: "2020",
    end_date: "2021",
    bullets: [
      "Learned the fundamentals shipping small features under review from senior engineers.",
      "Automated repetitive workflows with scripts, saving the team hours each week.",
    ],
    display_order: 2,
    status: "published",
  },
];

// Placeholder education entries (mirrors app/about/page.tsx fallback)
const EDUCATION = [
  {
    degree: "BS Information Technology",
    institution: "Placeholder University",
    location: "On-site",
    start_year: "2022",
    end_year: "2026",
    description: "",
    display_order: 0,
    status: "published",
  },
];

// Placeholder certifications (mirrors app/about/page.tsx fallback)
const CERTIFICATIONS = [
  {
    title: "Certified Ethical Hacking Fundamentals",
    issuer: "Placeholder Academy",
    issue_date: "2024",
    credential_url: null,
    display_order: 0,
    status: "published",
  },
  {
    title: "Cloud Practitioner Essentials",
    issuer: "Placeholder Cloud",
    issue_date: "2023",
    credential_url: null,
    display_order: 1,
    status: "published",
  },
];

async function seed() {
  console.log("🌱 Seeding Supabase database with initial real data...");

  // 1. Settings
  for (const s of SETTINGS) {
    await supabase.from('site_settings').upsert(s, { onConflict: 'key' });
  }
  console.log("✅ Site settings seeded.");

  // 2. About Sections
  for (const a of ABOUT_SECTIONS) {
    await supabase.from('about_sections').upsert(a, { onConflict: 'key' });
  }
  console.log("✅ About sections seeded.");

  // 3. Tools
  for (const t of TOOLS) {
    await supabase.from('tools').upsert(t, { onConflict: 'name' });
  }
  console.log("✅ Tools & Toolbox seeded.");

  // 4. Projects
  for (const p of PROJECTS) {
    await supabase.from('projects').upsert(p, { onConflict: 'slug' });
  }
  console.log("✅ Projects seeded.");

  // 5. Testimonials — no stable unique key, so delete matching names first
  // to keep re-runs idempotent, then insert fresh rows.
  await supabase
    .from('testimonials')
    .delete()
    .in('name', TESTIMONIALS.map((t) => t.name));
  const { error: testimonialError } = await supabase.from('testimonials').insert(TESTIMONIALS);
  if (testimonialError) console.warn("⚠️ Testimonials seed skipped:", testimonialError.message);
  else console.log("✅ Testimonials seeded.");

  // 6. Experience — same delete-then-insert guard keyed on role.
  await supabase
    .from('experience')
    .delete()
    .in('role', EXPERIENCE.map((e) => e.role));
  const { error: experienceError } = await supabase.from('experience').insert(EXPERIENCE);
  if (experienceError) console.warn("⚠️ Experience seed skipped:", experienceError.message);
  else console.log("✅ Experience seeded.");

  // 7. Education — delete-then-insert guard keyed on degree.
  await supabase
    .from('education')
    .delete()
    .in('degree', EDUCATION.map((e) => e.degree));
  const { error: educationError } = await supabase.from('education').insert(EDUCATION);
  if (educationError) console.warn("⚠️ Education seed skipped:", educationError.message);
  else console.log("✅ Education seeded.");

  // 8. Certifications — delete-then-insert guard keyed on title.
  await supabase
    .from('certifications')
    .delete()
    .in('title', CERTIFICATIONS.map((c) => c.title));
  const { error: certificationError } = await supabase.from('certifications').insert(CERTIFICATIONS);
  if (certificationError) console.warn("⚠️ Certifications seed skipped:", certificationError.message);
  else console.log("✅ Certifications seeded.");

  console.log("🎉 Database seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
