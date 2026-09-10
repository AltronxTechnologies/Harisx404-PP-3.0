/** Environment-safe fallback shown until the admin-managed Buildlog migration
 *  is available. The database is the canonical production source. */

export interface BuildlogItem {
  title: string;
  description?: string;
  /** Version, ship date, or status shown in the badge (e.g. "v2.1", "Q2 2026", "planned"). */
  badge: string;
  done: boolean;
}

export interface BuildlogProject {
  name: string;
  /** Short tagline shown under the project name in the sticky header. */
  tagline: string;
  /** One-liner about what the project is. */
  info: string;
  currentVersion: string;
  githubUrl?: string;
  liveUrl?: string;
  items: BuildlogItem[];
}

export const buildlogProjects: BuildlogProject[] = [
  {
    name: "This Website",
    tagline: "Portfolio & blog.",
    info: "Next.js 15 portfolio with Supabase, MDX articles, live stats, and an admin dashboard.",
    currentVersion: "v2.1",
    githubUrl: "https://github.com/harisx404/harisx404-portfolio",
    liveUrl: "https://harisx404.vercel.app",
    items: [
      {
        title: "Blog details reading experience",
        description: "Floating TOC pill with progress ring, themed code blocks, image lightbox, share menu.",
        badge: "v2.1",
        done: true,
      },
      {
        title: "Community wall (guestbook)",
        description: "GitHub sign-in, sticky-note cards with doodles, wavy perforations, copy-link anchors.",
        badge: "v2.1",
        done: true,
      },
      {
        title: "Live stats page",
        description: "Article views, reactions, GitHub contribution graph, and site metrics from Supabase.",
        badge: "v2.0",
        done: true,
      },
      {
        title: "Admin dashboard",
        description: "Manage blogs, projects, certifications, and testimonials with a Tiptap editor.",
        badge: "v2.0",
        done: true,
      },
      {
        title: "Buildlog redesign",
        description: "Per-project release notes with shipped and planned work.",
        badge: "v2.1",
        done: true,
      },
      {
        title: "AI article assistant",
        description: "Gemini-powered drafting and summaries inside the admin editor.",
        badge: "planned",
        done: false,
      },
      {
        title: "Audio articles",
        description: "Listen to write-ups with generated narration and a mini player.",
        badge: "planned",
        done: false,
      },
    ],
  },
  {
    name: "IntruShield NIDS",
    tagline: "Smart. Secure. Scalable.",
    info: "SOC platform for network intrusion detection built with Suricata 7 and FastAPI.",
    currentVersion: "v1.2",
    items: [
      {
        title: "Suricata 7 deep-packet inspection",
        description: "Live alerts streaming to the SOC dashboard over WebSockets.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Rule management & alert triage",
        description: "FastAPI backend with role-based analyst access and triage workflows.",
        badge: "v1.1",
        done: true,
      },
      {
        title: "Threat timeline & severity analytics",
        description: "PostgreSQL-backed filtering and severity analytics for alert review.",
        badge: "v1.2",
        done: true,
      },
      {
        title: "ML-based anomaly scoring",
        description: "Score flows with a trained model to cut alert fatigue.",
        badge: "planned",
        done: false,
      },
      {
        title: "Multi-sensor fleet management",
        description: "Deploy and monitor sensors across networks from one console.",
        badge: "planned",
        done: false,
      },
    ],
  },
  {
    name: "MedicaLink-HMS",
    tagline: "Care, connected.",
    info: "Hospital management SaaS on the MERN stack with AI assistance and real-time updates.",
    currentVersion: "v1.1",
    githubUrl: "https://github.com/harisx404/MedicaLink-HMS",
    items: [
      {
        title: "Multi-role portals",
        description: "Admin, doctor, and patient portals with appointment scheduling.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Live status over WebSockets",
        description: "Appointments and queues update in real time across portals.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Gemini clinical assistant",
        description: "Drafts clinical summaries and answers records queries in context.",
        badge: "v1.1",
        done: true,
      },
      {
        title: "Pharmacy & inventory module",
        description: "Stock tracking with reorder alerts and dispensing history.",
        badge: "planned",
        done: false,
      },
      {
        title: "Insurance claims workflow",
        description: "Submit, track, and reconcile claims from the admin portal.",
        badge: "planned",
        done: false,
      },
    ],
  },
  {
    name: "PacketVision",
    tagline: "See every packet.",
    info: "High-performance network packet inspection engine using Python and Scapy.",
    currentVersion: "v1.0",
    items: [
      {
        title: "Live capture & protocol decoding",
        description: "Scapy engine with per-protocol filters.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Wireshark-compatible PCAP export",
        description: "One-click export for deeper offline analysis.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Real-time traffic graphs",
        description: "Tkinter UI with conversation tracking.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Web dashboard",
        description: "Move the UI to the browser with a FastAPI backend.",
        badge: "planned",
        done: false,
      },
    ],
  },
];
