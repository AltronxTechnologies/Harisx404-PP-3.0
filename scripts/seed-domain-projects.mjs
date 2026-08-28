/**
 * Seed: 2 published projects per domain (Web / Cybersecurity / AI-ML).
 *
 * - Upserts on slug → safe to re-run; existing rows are enriched, missing
 *   rows are created. Covers are temporary Unsplash landscape shots
 *   (owner will replace with real product screenshots via admin).
 * - Also seeds domain tags and project_tags links.
 *
 * Run (inside the web container):
 *   node --env-file=.env.local scripts/seed-domain-projects.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

const projects = [
  /* ── Cybersecurity (2) ─────────────────────────────────────── */
  {
    slug: "intrushield-nids",
    title: "IntruShield NIDS",
    tagline:
      "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    description:
      "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    category: "Web App",
    tech_stack: ["Python", "FastAPI", "Suricata 7", "React", "WebSockets", "PostgreSQL"],
    features: [
      "Suricata 7 deep-packet inspection streaming live alerts to a real-time SOC dashboard over WebSockets.",
      "FastAPI backend with rule management, alert triage workflows, and role-based analyst access.",
      "Threat timeline and severity analytics built on PostgreSQL with sub-second query paths.",
      "Dockerised deployment with per-sensor config profiles and one-command SOC bring-up.",
    ],
    cover_image_url: img("photo-1551288049-bebda4e38f71"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 0,
    start_date: "2026-04-10",
    tags: ["cybersecurity", "networking"],
  },
  {
    slug: "packetvision-network-sniffer",
    title: "PacketVision Network Sniffer",
    tagline:
      "A high-performance network packet inspection engine using Python and Scapy.",
    description:
      "A high-performance network packet inspection engine using Python and Scapy.",
    category: "Web App",
    tech_stack: ["Python", "Scapy", "Tkinter", "Wireshark-compatible PCAP"],
    features: [
      "Live packet capture and protocol decoding engine built on Scapy with per-protocol filters.",
      "One-click export to Wireshark-compatible PCAP for deeper offline analysis.",
      "Lightweight Tkinter UI with real-time traffic graphs and conversation tracking.",
      "Multi-threaded capture core that keeps the UI at 60fps even under heavy traffic bursts.",
    ],
    cover_image_url: img("photo-1558494949-ef010cbdcc31"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 2,
    start_date: "2025-02-12",
    tags: ["cybersecurity", "networking"],
  },

  /* ── Web (2) ───────────────────────────────────────────────── */
  {
    slug: "medicalink-hms",
    title: "MedicaLink-HMS",
    tagline:
      "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    description:
      "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    category: "Web App",
    tech_stack: ["MongoDB", "Express.js", "React", "Node.js", "WebSockets", "Gemini AI"],
    features: [
      "Multi-role portals (admin, doctor, patient) with appointment scheduling and live status updates over WebSockets.",
      "Gemini-powered assistant that drafts clinical summaries and answers records queries in context.",
      "MERN architecture with audit logging and granular permissions designed for sensitive health data.",
      "Automated appointment reminders and lab-report notifications via email and in-app alerts.",
    ],
    cover_image_url: img("photo-1576091160399-112ba8d25d1d"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 1,
    start_date: "2025-07-20",
    tags: ["web", "saas"],
  },
  {
    slug: "taskflow-workspace",
    title: "TaskFlow Workspace",
    tagline:
      "A collaborative project-management SaaS with kanban boards, live cursors, and team analytics — built on Next.js and Supabase.",
    description:
      "A collaborative project-management SaaS with kanban boards, live cursors, and team analytics — built on Next.js and Supabase.",
    category: "Web App",
    tech_stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "PostgreSQL", "Framer Motion"],
    features: [
      "Realtime kanban with drag-and-drop, presence avatars, and live cursors powered by Supabase channels.",
      "Row-level-security data model so every workspace, board, and comment is isolated per team.",
      "Team analytics dashboard: burndown, cycle time, and workload heatmaps rendered server-side.",
      "Command-palette navigation and keyboard-first workflows across every board and view.",
    ],
    cover_image_url: img("photo-1460925895917-afdab827c52f"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 3,
    start_date: "2025-11-05",
    tags: ["web", "saas"],
  },

  /* ── AI / ML (2) ───────────────────────────────────────────── */
  {
    slug: "neurodoc-ai-assistant",
    title: "NeuroDoc AI Assistant",
    tagline:
      "A RAG-powered document assistant that answers questions over private PDFs with cited sources, streaming tokens, and per-workspace vector stores.",
    description:
      "A RAG-powered document assistant that answers questions over private PDFs with cited sources, streaming tokens, and per-workspace vector stores.",
    category: "Web App",
    tech_stack: ["Python", "LangChain", "OpenAI", "pgvector", "FastAPI", "Next.js"],
    features: [
      "Retrieval-augmented generation pipeline with chunking, embeddings, and pgvector similarity search.",
      "Streaming answers with inline citations that deep-link to the exact page of the source PDF.",
      "Per-workspace vector isolation and usage metering, ready for multi-tenant billing.",
      "Evaluation harness with golden-answer sets to catch retrieval regressions before deploy.",
    ],
    cover_image_url: img("photo-1677442136019-21780ecad995"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 4,
    start_date: "2026-01-18",
    tags: ["ai-ml", "llm"],
  },
  {
    slug: "visionforge-ml-studio",
    title: "VisionForge ML Studio",
    tagline:
      "An end-to-end machine learning studio for image classification — dataset labeling, transfer-learning training runs, and one-click model export.",
    description:
      "An end-to-end machine learning studio for image classification — dataset labeling, transfer-learning training runs, and one-click model export.",
    category: "Web App",
    tech_stack: ["Python", "TensorFlow", "Keras", "NumPy", "FastAPI", "React"],
    features: [
      "In-browser dataset labeling with keyboard-first shortcuts and automatic class balancing hints.",
      "Transfer-learning training runs on MobileNet/ResNet backbones with live loss and accuracy charts.",
      "One-click export to TFLite and ONNX with an instant hosted inference endpoint for testing.",
      "Confusion-matrix explorer and per-class metrics to debug model weaknesses visually.",
    ],
    cover_image_url: img("photo-1620712943543-bcc4688e7485"),
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 5,
    start_date: "2025-05-22",
    tags: ["ai-ml", "computer-vision"],
  },
];

const TAGS = [
  { name: "Cybersecurity", slug: "cybersecurity" },
  { name: "Networking", slug: "networking" },
  { name: "Automation", slug: "automation" },
  { name: "Web", slug: "web" },
  { name: "SaaS", slug: "saas" },
  { name: "AI/ML", slug: "ai-ml" },
  { name: "LLM", slug: "llm" },
  { name: "Computer Vision", slug: "computer-vision" },
];

async function main() {
  /* 1 — tags */
  const { data: tagRows, error: tagErr } = await supabase
    .from("tags")
    .upsert(TAGS, { onConflict: "slug" })
    .select("id, slug");
  if (tagErr) throw tagErr;
  const tagId = Object.fromEntries(tagRows.map((t) => [t.slug, t.id]));

  /* 2 — projects (year derived from start_date, matching the homepage) */
  for (const p of projects) {
    const { tags, ...row } = p;
    const d = new Date(row.start_date);
    row.year = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
    const { data, error } = await supabase
      .from("projects")
      .upsert(row, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw new Error(`${p.slug}: ${error.message}`);

    /* 3 — tag links (idempotent) */
    for (const slug of tags) {
      const { error: linkErr } = await supabase
        .from("project_tags")
        .upsert(
          { project_id: data.id, tag_id: tagId[slug] },
          { onConflict: "project_id,tag_id", ignoreDuplicates: true }
        );
      if (linkErr && !/duplicate/i.test(linkErr.message))
        console.warn(`  tag link ${p.slug}→${slug}: ${linkErr.message}`);
    }
    console.log(`✓ ${p.slug}`);
  }
  console.log("Done — 6 published projects (2 web, 2 security, 2 AI/ML).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
