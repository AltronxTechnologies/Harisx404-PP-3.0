# Production Content: Asset Brief and Replacement Guide

This guide covers the ten articles in `blogs/` and six case studies in `projects/` imported from `main`. Those folders are **editorial source**, not public routes. Current public Blog and Project pages read Supabase; copying a file into either folder does not publish it. Do not delete or replace connected records until a verified backup and restore plan exists.

## Temporary Covers

- A temporary cover must be visibly neutral and honestly labelled. `public/blog/production-placeholder.jpg` is a 1600 x 900 Harisx404-branded placeholder, not a product screenshot. The ten source Blog files now reference `/blog/production-placeholder.jpg` with honest alt text. Suggested project caption: `Temporary branded cover. Product screenshots will replace this image before publication.`
- Blog Admin accepts a local `/blog/...` cover or an approved HTTPS image host. Project Admin requires an **absolute HTTP(S)** cover URL, even for a draft. Upload the placeholder to the Media Library when a disposable connected environment is ready; use its returned HTTPS URL and media ID rather than inventing a production URL. The owner-reported upload 413 is still a gateway acceptance issue: confirm a small test upload before attempting the batch.
- Do not treat a caption or alt-text description in the supplied MDX as an image. The intended final `/images/blog/.../cover.webp` paths in the table below do not exist yet. The temporary `/blog/production-placeholder.jpg` URL is reachable, but replace it with the final approved cover URL through Admin before publication.
- For final covers, supply original or properly licensed artwork at roughly 1600 x 900 (16:9), preferably WebP/JPEG at a reasonable web size. Keep the subject legible when cropped to a card. Avoid logos you do not own, fabricated product interfaces, fake measurements, and text baked into images. Check light/dark card crops and mobile widths in a real browser.

## Article Cover Briefs

Create original editorial illustrations, not simulated screenshots or charts that appear to report real measurements. The paths below are **requested deliverables**, not files that already exist. Upload via Admin when ready and update the corresponding post's cover URL/ID. Write final alt text describing the image actually delivered, not just the prompt.

| Source slug / proposed file | Art direction and factual constraint | Suggested alt if the final image matches |
| --- | --- | --- |
| `securing-ai-agents` / `public/images/blog/securing-ai-agents/cover.webp` | A tool-connected agent inside a narrow permission boundary, with an untrusted document outside it. Show approval as a gate, not a promise of total protection. | Diagram of an AI agent, external content, scoped tools and an approval gate. |
| `post-quantum-cryptography-migration` / `public/images/blog/post-quantum-cryptography-migration/cover.webp` | A calm key-exchange transition from current to post-quantum cryptography; avoid implying a protocol or deadline not verified in the article. | Abstract illustration of classical and post-quantum key exchange paths. |
| `ai-security-operations-center` / `public/images/blog/ai-security-operations-center/cover.webp` | An analyst triage flow grouping alert signals into reviewable incidents. Use abstract sample data only. | Illustration of security alerts flowing into an analyst review queue. |
| `reliable-rag` / `public/images/blog/reliable-rag/cover.webp` | Retrieved passages connected to a response with visible citations and an uncertain/no-answer path. | Illustration of retrieved documents supporting a cited answer. |
| `small-vs-large-language-models` / `public/images/blog/small-vs-large-language-models/cover.webp` | Compare a compact local model and a larger remote model without invented speed, accuracy or cost values. | Two different-sized model nodes serving distinct workloads. |
| `ai-application-evaluation` / `public/images/blog/ai-application-evaluation/cover.webp` | A test set, criteria and human review forming a repeatable evaluation loop. No fabricated score. | Illustration of an AI evaluation workflow with tests and review. |
| `ai-workloads-network-architecture` / `public/images/blog/ai-workloads-network-architecture/cover.webp` | Compute clusters connected across a network fabric; distinguish the training and inference paths visually. | Network paths connecting AI compute clusters. |
| `zero-trust-networking-cloud` / `public/images/blog/zero-trust-networking-cloud/cover.webp` | Workloads in segmented zones with explicit permitted routes; no claim that a diagram alone enforces zero trust. | Segmented cloud workloads with a small number of allowed connections. |
| `nextjs-16-cache-components` / `public/images/blog/nextjs-16-cache-components/cover.webp` | Rendered page regions showing static, cached and dynamic parts. Avoid a copied Next.js brand/logo. | Page layout showing static, cached and dynamic regions. |
| `type-safe-mern-typescript` / `public/images/blog/type-safe-mern-typescript/cover.webp` | A request/response contract spanning client, API and database validation. Do not suggest compile-time types replace runtime checks. | Diagram connecting client, API validation and data model through a typed contract. |

## In-Article Illustrations

The supplied articles contained eleven literal `Image Prompt`/`Placement` blocks. Those instructions have been removed from the reader-facing MDX; the briefs are preserved here. Illustrations are optional: if you make one, insert it at the stated point with an accurate alt description; otherwise the article should remain readable without it. Use diagrams, not invented data visualizations. The general cover rules above also apply.

| Article / placement | Optional illustration brief |
| --- | --- |
| `securing-ai-agents`, after the Rule of Two | Three circles A, B and C; show their shared center as the risky combination. Keep labels legible and do not imply the rule is a formal security standard. |
| `securing-ai-agents`, before the five controls | An agent inside concentric boundaries for approval, tool validation, scoped identity, sandbox and egress. Show an untrusted input stopping at a boundary rather than a guarantee of protection. |
| `reliable-rag`, after the pipeline | Question branches into keyword and vector retrieval, merges, filters, reranks, then reaches a cited answer. Preserve the order described in the article. |
| `small-vs-large-language-models`, after the comparison | Two differently sized model nodes balanced by the task; avoid unlabeled performance symbols that suggest measured results. |
| `small-vs-large-language-models`, after the routing example | Request to router to small model to deterministic check, with failed checks escalating to a large model. |
| `ai-application-evaluation`, after the runner | Evaluation set, application, code/model/human graders and a review loop. Do not fabricate a scorecard. |
| `ai-workloads-network-architecture`, after the Meta/ECMP explanation | Leaf-and-spine paths with multiple large flows sharing one congested link and others underused. Confirm the diagram against the cited paper. |
| `ai-workloads-network-architecture`, after the domain table | Scale-up within a node/rack, scale-out across racks, scale-across between data centers. Label each domain for comprehension. |
| `zero-trust-networking-cloud`, after the traffic sections | Identity-aware entry path, separate workload enforcement points and an explicitly denied lateral connection. Do not suggest that a diagram enforces policy. |
| `nextjs-16-cache-components`, after the choices table | Static shell, cached regions and streamed regions as three clearly distinguishable page layers; use no copied vendor logo. |
| `type-safe-mern-typescript`, after the contracts example | A shared contract flowing to client and API with a *runtime* validation gate at the request boundary. Do not imply TypeScript alone validates network input. |

## Project Screenshot Briefs

Use **screenshots of the actual product or tool** instead of AI-generated interfaces. If a feature does not exist, do not illustrate it as shipped. Capture a 16:9 cover and, optionally, up to a few distinct workflow screenshots. Upload through Admin Media, then choose the cover and ordered gallery, each with its own alt text and a short, factual caption. Use synthetic/demo data; hide access tokens, usernames, private logs, patient information and real customer addresses.

| Source slug | First screenshot to take | Suggested factual cover caption |
| --- | --- | --- |
| `tourmate-malakand` | A real map or trip-discovery view with synthetic location/itinerary data; avoid revealing an SOS request or private position. | TourMate trip-discovery view using demonstration data. |
| `intrushield-nids` | The running alert-triage or telemetry view with explicitly synthetic events. **Remove or rotate the demo credentials currently printed in the source before publishing.** | IntruShield alert-triage screen with sample security telemetry. |
| `packetvision-network-sniffer` | The real command-line capture/filter output and optionally a separate export workflow; do not substitute the older seeded Tkinter concept. Keep the existing public slug `packetvision-network-sniffer`. | PacketVision command-line packet review using sample traffic. |
| `harisx404-portfolio-platform` | The actual public homepage and, if using an Admin screenshot, a session with all private content redacted. | Harisx404 portfolio homepage at the reviewed release. |
| `mail-lens-ai-phishguard` | The real classifier and explanation screen with a fictional message and no real sender details or unverified scores. | Mail-Lens analysis of a synthetic email example. |
| `medicalink-hms` | An actual appointment or staff handoff screen containing de-identified demonstration records; do not imply clinical deployment or compliance certification. | MedicaLink demonstration appointment workflow with fictional data. |

## Replacement Checklist

1. Review the supplied article/project text, dates, attribution and technical claims. Keep the original `date` values for now as requested; update them in Admin after publication decisions. Remove the eleven prompt blocks, unsupported claims, and any exposed demo access details before going live.
2. Save covers and optional illustrations/screenshots outside the repo until rights and redaction checks are complete. Record the final source, license/ownership, alt text, caption, size and intended slug in a private asset inventory. Never include credentials or private records in screenshots.
3. On a restore-verified disposable environment, use Admin Media for supported images. Check the response and media-library entry before referencing its URL; avoid duplicate uploads after an uncertain response. A small neutral placeholder may be used for draft-only review, clearly labelled as temporary.
4. Create/update the matching **draft** records, not parallel published duplicates. Preserve existing project UUIDs and the established PacketVision slug; verify cross-links, related selections, rendered Markdown/MDX, image crops and metadata at phone and desktop widths. The three submitted Project tables were rewritten as Markdown lists for the existing renderer; check those lists visually after import.
5. Replace placeholders through Admin with real covers and verify gallery order, captions, alt text, article links, public cards and social previews. Publish only after the owner's content and factual sign-off. Remove an old Media Library asset only after reference checks confirm it is unused; Cloudinary and database deletion are not atomic.
