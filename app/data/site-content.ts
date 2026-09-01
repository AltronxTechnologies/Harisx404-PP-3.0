// =====================================================================
// 📝 SITE CONTENT — the single place to edit the homepage's static text
// =====================================================================
//
// HOW TO USE
// ----------
// Every hardcoded string on the homepage lives here. Find the section
// you want to change (the big "✏️ EDIT HERE" banners below), edit the
// string, save, and the site updates — no need to touch any component.
//
// Components that read from this file:
//   - app/components/home/HomeHero.tsx
//   - app/components/home/StatusRow.tsx
//   - app/components/home/HomeBento.tsx
//   - app/components/home/AboutTeaser.tsx
//   - app/components/home/CtaSection.tsx
//
// ⚠️ Keep the SHAPE of the object intact (don't remove keys or change
// array lengths where noted) — only edit the string values.
// =====================================================================

export const siteContent = {
  // ============================================
  // ✏️ EDIT HERE: Hero section text
  // ============================================
  hero: {
    // Big display heading, split across two lines.
    // line2Italic is rendered in italic with the gradient accent.
    line1: "Full stack",
    line2Italic: "engineer",

    // ✏️ EDIT HERE: rotating headline pairs — the giant hero heading cycles
    // through these domains (line1 = white serif, line2 = gradient italic).
    // accent picks the domain gradient: fullstack (teal/green),
    // cyber (blue), ai (violet/purple).
    headlines: [
      { line1: "Full stack", line2: "engineer", accent: "fullstack" },
      { line1: "Cybersecurity", line2: "professional", accent: "cyber" },
      { line1: "AI", line2: "engineer", accent: "ai" },
    ],

    // Rotating tagline under the heading (cycles every 3s, mono uppercase).
    statusLines: [
      "Remote from Pakistan",
      "Available for opportunities",
      "Secure & scalable by design",
      "Full-stack · Security · AI",
      "Shipping end to end",
    ],

    // Your name, shown as the large heading on the right.
    firstName: "Muhammad",
    lastName: "Haris",

    // "New launch" block — label, project name, sub-line and link.
    newLaunch: {
      label: "New launch · IntruShield",
      // ✏️ EDIT HERE: project name shown in large display type.
      name: "IntruShield",
      // ✏️ EDIT HERE: static mono sub-line under the project name.
      subline: "Smart. Secure. Scalable.",
      href: "/projects/intrushield-nids",
    },
  },

  // ============================================
  // ✏️ EDIT HERE: Status row (4 cells under hero)
  // ============================================
  // First 3 cells are links; the 4th is the "Reach out" cell whose
  // button uses cta.email below. `color` is a Tailwind bg class for
  // the little square dot.
  statusRow: [
    {
      label: "Writing",
      // Fallback only — replaced at runtime with the latest published post.
      title: "Engineering reads",
      subtitle: "Process & patterns",
      href: "/blog",
      color: "bg-blue-500",
      ping: "bg-blue-400",
    },
    {
      // Live local-time cell — clock ticks in this IANA timezone.
      label: "Local time",
      title: "Asia/Karachi", // ✏️ EDIT HERE: your IANA timezone.
      subtitle: "",
      href: "/contact",
      color: "bg-pink-500",
      ping: "bg-pink-400",
    },
  ],

  // ============================================
  // ✏️ EDIT HERE: Bento grid cards
  // ============================================
  bento: {
    buildTogether: {
      title: "Let's Build Together",
      subtitle: "Clear communication, fast iterations, no surprises.",
    },
    tech: {
      title: "Tech Stack",
      subtitle: "The stack behind everything I ship.",
    },
    whatYouGet: {
      title: "What You Get",
      subtitle: "Clean code, pixel-perfect UI, deployed & scaling.",
      // Small floating chip inside the card.
      chipTitle: "Meets Deadlines",
      chipSubtitle: "Scoped, estimated, delivered on time",
    },
    // ✏️ EDIT HERE: cycling badge messages inside the "What You Get" card
    // (each shows for ~3s: bold title + muted subtitle).
    whatYouGetBadges: [
      { title: "Code You Keep", subtitle: "Clean handoff, zero lock-in" },
      { title: "Loads Instantly", subtitle: "Fast loads, happy users" },
      { title: "Meets Deadlines", subtitle: "Scoped, estimated, delivered on time" },
    ],
    timezones: {
      title: "Flexible With Timezones",
      subtitle: "Available globally.",
    },
    // Cities shown scrolling in the timezones card.
    cities: ["New Delhi", "London", "New York", "Dubai", "Tokyo", "Sydney"],

    // Tech marquee rows (3 rows of chips).
    techRows: [
      ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js"],
      ["Express", "MongoDB", "PostgreSQL", "Supabase", "Docker"],
      ["Git", "Linux", "Python", "Redis", "AWS"],
    ] as string[][],
  },

  // ============================================
  // ✏️ EDIT HERE: "Know about me" teaser section
  // ============================================
  aboutTeaser: {
    // Small mono kicker above the heading.
    kicker: "Know about me",

    // Heading — the italic accent word is appended by the component.
    heading: "I solve hard problems:",
    headingAccent: "build, secure, evolve.",

    // Bio paragraphs (one array item per <p>).
    paragraphs: [
      "I'm Haris — a BSIT graduate from the University of Malakand working across three domains: web development, cybersecurity, and AI/ML. I build full-stack apps with MERN and Next.js, and I secure them from day one with OWASP protections, JWT + RBAC auth, and zero-trust defaults. When an API was too slow, I cut its response time by 99%. When analysts were stuck with static logs, I built a real-time intrusion detection dashboard.",
      "The results back it up: Top 15% nationally in Pakistan's NSCT among 33,000+ graduates, 96% in Cybersecurity coursework, and hands-on SOC experience with Wazuh SIEM. I'm growing into AI/ML, because hard problems deserve smarter solutions.",
    ],

    // Phrases inside the paragraphs that get emphasized (brighter + medium).
    // ⚠️ Each phrase must EXACTLY match text in `paragraphs` above — if you
    // reword the bio, update this list too or the highlight silently drops.
    highlights: [
      "web development, cybersecurity, and AI/ML",
      "99%",
      "Top 15%",
      "33,000+",
      "96%",
      "Wazuh SIEM",
    ],

    // Compact proof-point strip under the bio.
    stats: [
      { value: "3.5/4.0", label: "CGPA · BSIT, UoM" },
      { value: "Top 15%", label: "NSCT nationwide" },
      { value: "96%", label: "Cybersecurity coursework" },
    ],

    // Social pill buttons (Resume sits in the middle).
    socials: [
      { label: "GitHub", href: "https://github.com/harisx404" },
      { label: "Resume", href: "/resume" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/harisx404/" },
    ],
  },

  // ============================================
  // ✏️ EDIT HERE: Contact page (/contact)
  // ============================================
  contact: {
    // Small mono kicker + display heading (accent gets the gradient).
    kicker: "Contact",
    heading: "A project, a role, or",
    headingAccent: "just a hello?",

    // ✏️ EDIT HERE: your Cal.com booking link (e.g. "harisx404/30min").
    // Leave empty ("") until you create one — the page then shows a
    // "request a call by email" card instead of the embedded calendar.
    calLink: "",

    // Details shown on the booking card / fallback.
    call: {
      title: "30 Min Meeting",
      duration: "30m",
      platform: "Google Meet",
      note: "Requires confirmation",
    },

    // Social pills next to the tabs.
    socials: [
      { label: "Email", href: "mailto:itsharis.tech@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/harisx404/" },
      { label: "GitHub", href: "https://github.com/harisx404" },
      { label: "Twitter", href: "https://twitter.com/harisx404" },
    ],
  },

  // ============================================
  // ✏️ EDIT HERE: Bottom call-to-action section
  // ============================================
  cta: {
    // Two-line uppercase display heading.
    line1: "From concept to creation",
    line2: "Let's make it happen!",

    // Button label + email address it mails to.
    buttonLabel: "Get In Touch",
    email: "itsharis.tech@gmail.com",

    // Small notes under the button.
    note1: "Full-time roles & freelance projects — remote, worldwide.",
    note2:
      "I thrive on crafting dynamic web applications and delivering seamless user experiences.",
  },
} as const;

export type SiteContent = typeof siteContent;
