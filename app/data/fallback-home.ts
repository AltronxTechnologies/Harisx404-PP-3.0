export type HomeProject = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  tech: string[];
  year: string;
  category: "Web App" | "Mobile App";
  image_url: string;
  features?: string[];
  /** all screenshots: cover first, then gallery (hover deck uses [1]) */
  images?: string[];
  /** curated topic tags (1–3 shown as chips; projects can span domains) */
  tags?: string[];
};

export type HomePost = {
  title: string;
  slug: string;
  href?: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
};

export type Testimonial = {
  quote_headline: string;
  quote: string;
  name: string;
  role: string;
  avatar_url?: string | null;
};

export const fallbackProjects: HomeProject[] = [
  {
    title: "SecureVault",
    slug: "securevault",
    tagline: "A password health dashboard that turns weak credentials into strong habits.",
    description:
      "Full-stack security tool that audits stored credentials, flags reused and breached passwords, and coaches users toward better hygiene with actionable scores.",
    tech: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
    year: "2025",
    category: "Web App",
    image_url: "",
  },
  {
    title: "ShopLift",
    slug: "shoplift",
    tagline: "A headless commerce storefront built for speed and conversion.",
    description:
      "Composable e-commerce frontend with edge-rendered product pages, instant search, and a cart that syncs across devices — sub-second loads on every route.",
    tech: ["Next.js", "React", "Supabase", "Stripe", "Vercel"],
    year: "2024",
    category: "Web App",
    image_url: "",
  },
  {
    title: "PulseBoard",
    slug: "pulseboard",
    tagline: "Realtime analytics that feel alive, not laggy.",
    description:
      "Streaming analytics dashboard with live websocket charts, anomaly alerts, and a query builder that non-engineers actually enjoy using.",
    tech: ["React", "Node.js", "Redis", "WebSockets", "MongoDB"],
    year: "2024",
    category: "Web App",
    image_url: "",
  },
  {
    title: "TaskForge",
    slug: "taskforge",
    tagline: "A team task manager forged for focus.",
    description:
      "Kanban-meets-timeline project tool with offline-first sync, granular permissions, and keyboard-driven workflows for teams that move fast.",
    tech: ["React Native", "TypeScript", "Express", "PostgreSQL"],
    year: "2023",
    category: "Mobile App",
    image_url: "",
  },
  {
    title: "NimbusNotes",
    slug: "nimbusnotes",
    tagline: "An AI note app that organizes itself while you think.",
    description:
      "Markdown-native notes with semantic search, automatic backlinking, and an on-device summarizer — your second brain, minus the maintenance.",
    tech: ["Next.js", "Python", "Supabase", "OpenAI", "Tailwind CSS"],
    year: "2023",
    category: "Mobile App",
    image_url: "",
  },
];

export const fallbackPosts: HomePost[] = [
  {
    title: "Shipping Faster with a Boring Tech Stack",
    slug: "shipping-faster-boring-stack",
    href: "/blog",
    summary:
      "Why I reach for proven tools over shiny ones, and how a boring stack helped me cut delivery time in half on client projects.",
    publishedAt: "2025-06-12T00:00:00.000Z",
    readingTime: "6 min read",
  },
  {
    title: "Threat Modeling for Frontend Developers",
    slug: "threat-modeling-for-frontend-devs",
    href: "/blog",
    summary:
      "A practical, jargon-free walkthrough of thinking like an attacker before you write your first component.",
    publishedAt: "2025-04-03T00:00:00.000Z",
    readingTime: "8 min read",
  },
  {
    title: "Postgres Patterns I Wish I Knew Earlier",
    slug: "postgres-patterns-i-wish-i-knew",
    href: "/blog",
    summary:
      "Indexes, row-level security, and jsonb tricks that took my Supabase projects from prototype to production-grade.",
    publishedAt: "2025-02-18T00:00:00.000Z",
    readingTime: "7 min read",
  },
  {
    title: "Designing APIs Humans Can Actually Read",
    slug: "designing-readable-apis",
    href: "/blog",
    summary:
      "Naming, versioning, and error-shape conventions that make integrating with your backend feel effortless.",
    publishedAt: "2024-12-05T00:00:00.000Z",
    readingTime: "5 min read",
  },
];

// Placeholder testimonials shown only when the database is unreachable or
// empty. Kept deliberately small and grounded in real project work
// (API performance, security-first builds, health-tech SaaS). No stock
// face photos — the card renders an initials avatar instead, and these
// entries are replaced as real, approved client submissions come in.
export const testimonials: Testimonial[] = [
  {
    quote_headline: "He cut our API response times by 99%.",
    quote:
      "Our booking search took seconds; after Haris rebuilt the query layer and caching it felt instant. He documented every change so our own team could maintain it after handover.",
    name: "Sarah Mitchell",
    role: "Product Manager, Travel Tech",
  },
  {
    quote_headline: "Security was the architecture, not an afterthought.",
    quote:
      "Haris designed our auth flows, RBAC and data model with OWASP protections from day one. When we ran an external review, nothing critical came back — that almost never happens.",
    name: "Imran Baig",
    role: "CTO, Fintech Startup",
  },
  {
    quote_headline: "Our platform finally feels enterprise-grade.",
    quote:
      "From multi-role portals to real-time status updates, everything he shipped just worked. Clear estimates, honest weekly updates, and zero surprises at delivery.",
    name: "Adeel Khan",
    role: "Project Lead, Health-Tech Startup",
  },
];
