# Disposable Project Detail Preview

`app/data/project-preview-fixtures.ts` contains distinct, illustrative case-study copy for the 10 currently published slugs. It is a **presentation fixture**, not a Supabase seed: no records or media are created, updated, or deleted. The preview decorates public project detail pages, the Projects index cards, and Home cards only when all of these are true:

- `NODE_ENV=development`
- `IS_ALLOY=true`
- `PROJECT_DETAIL_PREVIEW_SEED` is not `false`

The checked-in Alloy Compose file enables the flag by default. Example links, stock gallery captions, and preview narrative copy identify illustrative content without a separate page notice. Preview detail pages also declare `noindex,nofollow`; their CreativeWork structured data and generated metadata still use the actual database record rather than example links or claims.

## Coverage

| Project slug | Preview category (cards/related) | Visit | Source |
| --- | --- | --- | --- |
| `intrushield-nids` | Cybersecurity / Network Defense | None | Private |
| `packetvision-network-sniffer` | Networking / CLI Tool | None | Example GitHub repo |
| `medicalink-hms` | Health Tech / SaaS | Example live link | Private |
| `neurodoc-ai-assistant` | AI / Knowledge Systems | None | Example source code |
| `visionforge-ml-studio` | AI / Computer Vision | Example live link | Not published |
| `taskflow-workspace` | Productivity / Collaboration | Example live link | Example project repo |
| `demo-shopstream-commerce` | E-commerce / Web | Example live link | Private |
| `demo-sentimentscope-nlp` | AI/ML / Language Processing | None | Example NLP repository |
| `demo-vaultaudit-scanner` | Cloud Security / Automation | None | Private |
| `demo-pulseboard-analytics` | Web Analytics / Privacy | Example live link | Example analytics repo |

Every fixture includes a unique short summary, overview, Why I built this, Key decisions, Results, What I learned, update label, and two or three captioned stock reference images. TaskFlow also previews five tags, including tags beyond the three shown on cards, to exercise full filtering. SentimentScope uses a portrait-only cover override to exercise cover orientation without changing its database record. Highlights and Built labels use the existing project record. External example links use `example.com` and GitHub's `octocat/Hello-World` sample repository, not an owner's deployment or source. Visit shows None without a URL; a named Source link appears in blue when present.

## Disable And Remove

Set `PROJECT_DETAIL_PREVIEW_SEED=false` in the environment used by the Alloy Compose stack and recreate the web container to preview the real Admin content. A production build always disables the fixture even if `IS_ALLOY` remains true. Before removing the temporary code entirely, delete `app/data/project-preview-fixtures.ts`, the `withProjectPreview` imports/calls in `app/page.tsx`, `app/projects/page.tsx`, and `app/projects/[slug]/page.tsx`, the `isPreview` link-label branches in `ProjectDetail.tsx`, and the Compose flag. Do not just delete the fixture file while its imports remain.

The four older `demo-*` projects were already persisted by `scripts/seed-demo-projects.mjs` before this fixture was added. Turning off the preview does **not** remove those database rows. Review that script's `--cleanup` behavior before using it on shared data. The case-study migration columns were present at the last read-only check; an authenticated Admin save/round-trip remains to be verified separately.
