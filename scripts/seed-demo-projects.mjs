#!/usr/bin/env node
/**
 * TEMPORARY: seeds 4 demo projects (slugs prefixed `demo-`) so the /projects
 * page has 10 published projects — enough to exercise pagination (6/page),
 * filters, and search with realistic content.
 *
 * Run:     node scripts/seed-demo-projects.mjs
 * Cleanup: node scripts/seed-demo-projects.mjs --cleanup
 *          (deletes projects with slug like `demo-%` and media in the
 *           `seed-temp` folder; join rows cascade or are removed first)
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function rest(method, path, body, prefer) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const U = "auto=format&fit=crop&w=1600&q=80";
const PROJECTS = [
  {
    slug: "demo-shopstream-commerce",
    title: "ShopStream Commerce",
    tagline:
      "A headless e-commerce storefront with real-time inventory, Stripe checkout, and sub-second product search across 50k SKUs.",
    content:
      "ShopStream is a full headless commerce build: a Next.js storefront backed by a typed product API, Stripe payment intents with webhook-driven order state, and Meilisearch for typo-tolerant instant search. Inventory updates stream to every open session over websockets so stock counts never lie. The admin panel supports bulk CSV imports, discount rules, and abandoned-cart recovery emails.",
    cover: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?${U}`,
    gallery: `https://images.unsplash.com/photo-1563013544-824ae1b704d3?${U}`,
    tech: ["Next.js", "TypeScript", "Stripe", "Meilisearch", "PostgreSQL", "Redis"],
    features: [
      "Typo-tolerant instant search across 50k SKUs with faceted filters, powered by Meilisearch.",
      "Stripe payment intents with webhook-driven order lifecycle and automatic refund handling.",
      "Real-time inventory sync over websockets so stock counts stay accurate in every session.",
      "Admin bulk CSV import with validation previews and rollback on partial failures.",
    ],
    year: "Q3 2024",
    start: "2024-07-05",
    order: 7,
    tags: ["Web", "SaaS"],
  },
  {
    slug: "demo-sentimentscope-nlp",
    title: "SentimentScope NLP",
    tagline:
      "A multilingual sentiment analysis API that classifies support tickets in 14 languages with confidence scoring and drift alerts.",
    content:
      "SentimentScope fine-tunes a multilingual transformer on 200k labelled support tickets, then serves it behind a FastAPI inference layer with batched requests and response caching. A drift monitor compares live prediction distributions against the training baseline and alerts when retraining is due. Ships with a dashboard showing per-language accuracy, confusion matrices, and confidence histograms.",
    cover: `https://images.unsplash.com/photo-1555949963-aa79dcee981c?${U}`,
    gallery: `https://images.unsplash.com/photo-1518186285589-2f7649de83e0?${U}`,
    tech: ["Python", "PyTorch", "Hugging Face", "FastAPI", "Docker", "Grafana"],
    features: [
      "Fine-tuned multilingual transformer covering 14 languages with per-language accuracy reporting.",
      "Batched FastAPI inference with response caching for a p95 latency under 80ms.",
      "Prediction-drift monitor that alerts when live traffic diverges from the training distribution.",
      "Confidence-scored outputs so downstream automation can route low-certainty tickets to humans.",
    ],
    year: "Q2 2024",
    start: "2024-04-14",
    order: 8,
    tags: ["AI/ML", "LLM"],
  },
  {
    slug: "demo-vaultaudit-scanner",
    title: "VaultAudit Scanner",
    tagline:
      "An automated cloud-misconfiguration scanner that audits AWS accounts against CIS benchmarks and generates fix-it playbooks.",
    content:
      "VaultAudit walks an AWS account with read-only credentials, evaluates 180+ CIS benchmark rules across IAM, S3, EC2, and RDS, and ranks findings by exploitability. Each finding links to a generated remediation playbook (console steps plus Terraform diff). Scheduled scans diff against the previous run so teams only review what changed. Slack alerts fire on new critical findings.",
    cover: `https://images.unsplash.com/photo-1563986768609-322da13575f3?${U}`,
    gallery: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?${U}`,
    tech: ["Python", "boto3", "Terraform", "Docker", "PostgreSQL", "Slack API"],
    features: [
      "180+ CIS benchmark checks across IAM, S3, EC2, and RDS with exploitability-ranked findings.",
      "Auto-generated remediation playbooks: console steps plus ready-to-apply Terraform diffs.",
      "Scheduled diff scans that surface only new or regressed findings between runs.",
      "Slack alerting pipeline that pages the on-call channel on new critical findings.",
    ],
    year: "Q1 2024",
    start: "2024-01-20",
    order: 9,
    tags: ["Cybersecurity", "Automation"],
  },
  {
    slug: "demo-pulseboard-analytics",
    title: "PulseBoard Analytics",
    tagline:
      "A privacy-first web analytics dashboard — cookieless tracking, real-time visitors, and shareable public stats pages.",
    content:
      "PulseBoard is a lightweight, cookieless alternative to heavyweight analytics suites. A 1.4kb tracking script sends anonymized events to an edge ingestion endpoint; ClickHouse aggregates them into real-time dashboards for pageviews, referrers, devices, and custom events. Sites can publish a public stats page with one toggle. Fully GDPR-compliant with no consent banner required.",
    cover: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?${U}`,
    gallery: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?${U}`,
    tech: ["Next.js", "TypeScript", "ClickHouse", "Cloudflare Workers", "Tailwind CSS"],
    features: [
      "1.4kb cookieless tracking script with anonymized visitor hashing — no consent banner needed.",
      "Edge ingestion on Cloudflare Workers feeding ClickHouse for sub-second dashboard queries.",
      "Real-time visitor feed with live pageview, referrer, and device breakdowns.",
      "One-toggle public stats pages for sharing site metrics with anyone.",
    ],
    year: "Q4 2023",
    start: "2023-10-08",
    order: 10,
    tags: ["Web", "Automation"],
  },
];

async function cleanup() {
  const projects = await rest("GET", "projects?select=id,slug&slug=like.demo-*");
  for (const p of projects) {
    await rest("DELETE", `project_tags?project_id=eq.${p.id}`);
    await rest("DELETE", `project_images?project_id=eq.${p.id}`);
    await rest("DELETE", `projects?id=eq.${p.id}`);
    console.log("deleted project:", p.slug);
  }
  await rest("DELETE", "media?folder=eq.seed-temp");
  console.log("deleted seed-temp media. Cleanup complete.");
}

async function seed() {
  const tags = await rest("GET", "tags?select=id,name");
  const tagId = Object.fromEntries(tags.map((t) => [t.name, t.id]));
  for (const p of PROJECTS) {
    const [proj] = await rest(
      "POST",
      "projects",
      {
        slug: p.slug,
        title: p.title,
        tagline: p.tagline,
        description: p.tagline,
        content: p.content,
        cover_image_url: p.cover,
        github_url: "https://github.com/harisx404",
        live_url: null,
        status: "published",
        featured: false, // keeps the LOCKED homepage showing only the real 6
        display_order: p.order,
        start_date: p.start,
        tech_stack: p.tech,
        category: "Web App",
        year: p.year,
        features: p.features,
      },
      "return=representation"
    );
    await rest(
      "POST",
      "project_tags",
      p.tags.map((t) => ({ project_id: proj.id, tag_id: tagId[t] })),
      "return=minimal"
    );
    let i = 1;
    for (const url of [p.cover, p.gallery]) {
      const [media] = await rest(
        "POST",
        "media",
        {
          public_id: `seed-temp/${p.slug}-${i}`,
          url,
          secure_url: url,
          format: "jpg",
          alt_text: `${p.title} — screenshot ${i}`,
          folder: "seed-temp",
        },
        "return=representation"
      );
      await rest(
        "POST",
        "project_images",
        { project_id: proj.id, media_id: media.id, display_order: i },
        "return=minimal"
      );
      i++;
    }
    console.log("seeded:", p.slug);
  }
  console.log("DONE. Remove later with: node scripts/seed-demo-projects.mjs --cleanup");
}

(process.argv.includes("--cleanup") ? cleanup() : seed()).catch((e) => {
  console.error(e);
  process.exit(1);
});
