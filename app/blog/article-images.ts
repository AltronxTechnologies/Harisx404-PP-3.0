const imageRoot = "/blog/article-images";
const legacyAgentImages = [
  "![h](https://res.cloudinary.com/i22q5puf/image/upload/v1792000121/portfolio/blog/c1000000-0000-0000-0000-000000000001/n5llzec1gneqawlpspxh.webp)",
  "![j](https://res.cloudinary.com/i22q5puf/image/upload/v1792000125/portfolio/blog/c1000000-0000-0000-0000-000000000001/uesnrbe5wu7opbui9bfb.webp)",
];

export const articleImages = {
  "securing-ai-agents": {
    cover: "securing-ai-agents-cover.webp",
    illustration: "securing-ai-agents-rule-of-two.webp",
    section: "A design budget: the Rule of Two",
    alt: "Illustration of untrusted input, tool access, outbound communication, and a human approval boundary for AI agents",
    caption: "The Rule of Two limits an agent's combination of untrusted input, sensitive access, and external actions.",
  },
  "post-quantum-cryptography-migration": {
    cover: "post-quantum-cryptography-migration-cover.webp",
    illustration: "post-quantum-cryptography-hybrid-exchange.webp",
    section: "Hybrid key exchange is already in production",
    alt: "Diagram of a hybrid TLS key exchange combining classical X25519 with post-quantum ML-KEM",
    caption: "Hybrid key exchange combines a classical and a post-quantum contribution to the session key.",
  },
  "ai-security-operations-center": {
    cover: "ai-security-operations-center-cover.webp",
    illustration: "ai-security-operations-center-autonomy-ladder.webp",
    section: "A pattern that works: the autonomy ladder",
    alt: "Illustrated security operations workflow with telemetry ingestion, AI-assisted triage, human approval, and containment",
    caption: "An illustrative SOC workflow places human approval between triage and high-impact responses.",
  },
  "reliable-rag": {
    cover: "reliable-rag-cover.webp",
    illustration: "reliable-rag-pipeline.webp",
    section: "The pipeline, in text",
    alt: "Five-stage RAG diagram showing chunking, hybrid retrieval, reranking, permission filtering, and grounded answers",
    caption: "A retrieval pipeline checks relevance and access before building cited answers.",
  },
  "small-vs-large-language-models": {
    cover: "small-vs-large-language-models-cover.webp",
    illustration: "small-vs-large-language-models-route-escalate.webp",
    section: "The pattern many teams end up with: route and escalate",
    alt: "Routing diagram showing a small language model checked by rules before escalating difficult requests to a larger model",
    caption: "Route routine tasks to a small model, check the result, and escalate when needed.",
  },
  "ai-application-evaluation": {
    cover: "ai-application-evaluation-cover.webp",
    illustration: "ai-application-evaluation-pipeline.webp",
    section: "A minimal runner",
    alt: "AI evaluation pipeline connecting test cases, an application, automated graders, human review, and release gates",
    caption: "Evaluation combines repeatable test cases, graders, review, and release decisions.",
  },
  "ai-workloads-network-architecture": {
    cover: "ai-workloads-network-architecture-cover.webp",
    illustration: "ai-workloads-network-clos-roce.webp",
    section: "Up, out, and across",
    alt: "Illustrated Clos network and parallel RoCE traffic paths for distributed AI workloads",
    caption: "AI clusters depend on both a scalable fabric and predictable transport for collective traffic.",
  },
  "zero-trust-networking-cloud": {
    cover: "zero-trust-networking-cloud-cover.webp",
    illustration: "zero-trust-networking-pdp-pep.webp",
    section: "The pieces: decide, then enforce",
    alt: "Zero-trust diagram showing a policy decision point, enforcement proxy, workload identity, and an encrypted service connection",
    caption: "A policy decision point and enforcement point control service-to-service access.",
  },
  "nextjs-16-cache-components": {
    cover: "nextjs-16-cache-components-cover.webp",
    illustration: "nextjs-16-cache-mental-model.webp",
    section: "The mental model: a static shell",
    alt: "Diagram of a Next.js page divided into static shell, cached content, and streamed dynamic content",
    caption: "Static, cached, and streamed layers have different loading responsibilities.",
  },
  "type-safe-mern-typescript": {
    cover: "type-safe-mern-typescript-cover.webp",
    illustration: "type-safe-mern-single-source-of-truth.webp",
    section: "A shared contracts package",
    alt: "Diagram of shared Zod contracts connecting a React frontend and an Express backend with runtime validation",
    caption: "Shared contracts define types, while runtime validation still protects the network boundary.",
  },
} as const;

export function articleCover(slug: string, fallback: string) {
  const entry = articleImages[slug as keyof typeof articleImages];
  return entry ? `${imageRoot}/${entry.cover}` : fallback;
}

export function articleIllustration(slug: string, code: string) {
  const entry = articleImages[slug as keyof typeof articleImages];
  if (!entry) return code;
  // The published agent article already embeds these two older images. Hide only
  // those exact references until the stored body can be updated after deployment.
  const body = slug === "securing-ai-agents"
    ? legacyAgentImages.reduce((text, image) => text.replace(image, "\n\n"), code)
    : code;
  if (/!\[[^\]]*\]\([^)]+\)|<Image\b|<img\b/i.test(body)) return body;

  const headings = Array.from(body.matchAll(/^##[ \t]+(.+?)\s*$/gm));
  const matches = headings.filter((heading) => heading[1]?.trim() === entry.section);
  if (matches.length !== 1) return body;
  const index = headings.indexOf(matches[0]);
  const next = headings[index + 1];
  if (!next || next.index === undefined) return body;

  const image = `${imageRoot}/${entry.illustration}`;
  if (body.includes(image)) return body;
  return `${body.slice(0, next.index).trimEnd()}\n\n![${entry.alt}](${image} "${entry.caption}")\n\n${body.slice(next.index)}`;
}
