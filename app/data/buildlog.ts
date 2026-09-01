/** Buildlog data — projects/apps with shipped features and upcoming updates.
 *  Edit this file to add releases: `done: true` rows render as checked with a
 *  version/date badge; `done: false` rows are upcoming plans. */

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
  items: BuildlogItem[];
}

export const buildlogProjects: BuildlogProject[] = [
  {
    name: "This Website",
    tagline: "Portfolio & blog.",
    info: "Next.js 15 portfolio with Supabase, MDX articles, live stats, and an admin dashboard.",
    currentVersion: "v2.1",
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
        description: "This page — per-project changelogs with shipped and planned work.",
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
    info: "Enterprise-grade SOC platform with real-time network intrusion detection built on Suricata 7 and FastAPI.",
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
        description: "PostgreSQL-backed analytics with sub-second query paths.",
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
  {
    name: "TaskFlow Workspace",
    tagline: "Teamwork, in sync.",
    info: "Collaborative project-management SaaS with kanban boards, live cursors, and team analytics.",
    currentVersion: "v1.1",
    items: [
      {
        title: "Realtime kanban",
        description: "Drag-and-drop with presence avatars and live cursors via Supabase channels.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Row-level-security data model",
        description: "Every workspace, board, and comment isolated per team.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Team analytics dashboard",
        description: "Burndown, cycle time, and workload heatmaps rendered server-side.",
        badge: "v1.1",
        done: true,
      },
      {
        title: "Automations & rules",
        description: "Trigger actions when cards move, age, or get labeled.",
        badge: "planned",
        done: false,
      },
      {
        title: "Native mobile app",
        description: "Boards on the go with offline-first sync.",
        badge: "planned",
        done: false,
      },
    ],
  },
  {
    name: "NeuroDoc AI",
    tagline: "Ask your documents.",
    info: "RAG-powered document assistant answering questions over private PDFs with cited sources.",
    currentVersion: "v1.0",
    items: [
      {
        title: "RAG pipeline",
        description: "Chunking, embeddings, and pgvector similarity search.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Streaming answers with citations",
        description: "Inline citations deep-link to the exact page of the source PDF.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Per-workspace vector isolation",
        description: "Usage metering ready for multi-tenant billing.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Multi-format ingestion",
        description: "DOCX, HTML, and scanned-PDF OCR support.",
        badge: "planned",
        done: false,
      },
    ],
  },
  {
    name: "VisionForge ML",
    tagline: "Train. Export. Deploy.",
    info: "End-to-end machine learning studio for image classification with one-click model export.",
    currentVersion: "v1.0",
    items: [
      {
        title: "In-browser dataset labeling",
        description: "Keyboard-first shortcuts with class-balancing hints.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Transfer-learning training runs",
        description: "MobileNet/ResNet backbones with live loss and accuracy charts.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "TFLite & ONNX export",
        description: "Instant hosted inference endpoint for testing.",
        badge: "v1.0",
        done: true,
      },
      {
        title: "Object detection support",
        description: "Bounding-box labeling and YOLO-family training.",
        badge: "planned",
        done: false,
      },
    ],
  },
];
