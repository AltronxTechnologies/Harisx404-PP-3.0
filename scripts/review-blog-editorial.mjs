import { createClient } from "@supabase/supabase-js";

const corrections = {
  "post-quantum-cryptography-migration": [[
    "The order also turned a long-range worry into dates. Per [Cloudflare's summary](https://blog.cloudflare.com/post-quantum-eo-2026/), federal high-value assets and high-impact systems must move to PQC for key establishment by December 31, 2030, and for digital signatures by December 31, 2031, and federal contractors are expected to meet post-quantum FIPS requirements by the end of 2030. You may not work for a federal agency, but vendors, customers, and auditors tend to inherit these timelines.",
    "The order also turned a long-range worry into dates. [EO 14412](https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/) sets December 31, 2030 for key establishment and December 31, 2031 for digital signatures in specified federal high-value assets and high-impact systems. It separately directs a **proposed** procurement rule for covered federal contractors; those contractor requirements are not yet a final blanket deadline. Even outside government, these dates are useful planning signals, not a substitute for checking the rules that apply to your organization.",
  ]],
  "ai-security-operations-center": [
    ["  close_as_benign:       { autonomy: auto_with_sampling, sample_rate: 0.10 }", "  close_as_benign:       { autonomy: approval_required }"],
    ["Sampling matters most for `close_as_benign`. A human re-checks a slice of the auto-closed alerts every week, which turns invisible misses into a measurable number.", "Keep benign closures under human review until replay tests and a monitored pilot establish which alert classes qualify, an acceptable miss rate, and a rollback trigger. Only then consider sampled review of low-risk auto-closures; sampling alone cannot catch every missed attack."],
    ["- Gate containment actions behind approval, and sample auto-closed alerts.", "- Require approval for containment and benign closures until a measured, reversible pilot justifies narrower automation."],
  ],
  "securing-ai-agents": [[
    "Record the prompt, the sources retrieved, every tool call with arguments and results, approvals, and which identity acted. Alert on bursts of calls or destinations you have never seen.",
    "Record the evidence needed to reconstruct decisions: prompts and retrieved sources where authorized, tool calls and outcomes, approvals, and the acting identity. Redact credentials and personal data, restrict access to traces, and set a retention limit before collecting them. Alert on bursts of calls or destinations you have never seen.",
  ]],
  "ai-application-evaluation": [
    ["- real user requests, from logs or support tickets once you have them", "- authorized, de-identified user requests from logs or support tickets once you have them"],
    ["Start with 30 to 100 cases and keep them in version control. Every failure you meet in production becomes a new case, so the set grows from reality.", "Start with 30 to 100 cases. Keep only synthetic or properly de-identified cases in version control; keep sensitive traces in access-controlled storage with an agreed retention period. Every failure you meet in production can inform a new case after you remove credentials, personal data, and customer-specific details."],
  ],
  "type-safe-mern-typescript": [[
    "End-to-end type safety means the shape of your data is checked from the database to the browser, so a change in one place breaks the build instead of breaking production. In a MERN app (MongoDB, Express, React, Node) the honest version has one extra rule: TypeScript types disappear at runtime, so every boundary where outside data arrives also needs a runtime check.",
    "End-to-end type safety gives the database, API, and browser a shared contract. Participating code can catch shape changes at build time, but a green build cannot prove a deployed API still matches. In a MERN app (MongoDB, Express, React, Node), TypeScript types disappear at runtime, so every boundary where outside data arrives also needs validation and contract tests.",
  ]],
  "reliable-rag": [[
    "RRF works on ranks, not scores, so you don't have to normalize BM25 scores against cosine similarities:",
    "[RRF works on ranks, not scores](https://learn.microsoft.com/azure/search/hybrid-search-ranking), so you don't have to normalize BM25 scores against cosine similarities:",
  ]],
  "zero-trust-networking-cloud": [[
    "This is the networking and architecture view for people building cloud applications. You'll see how the pieces fit together, what microsegmentation actually does, and a default-deny Kubernetes example to try.",
    "This is the networking and architecture view for people building cloud applications. You'll see how the pieces fit together, what microsegmentation actually does, and a default-deny Kubernetes policy to adapt in a test namespace after accounting for DNS and required service traffic.",
  ]],
  "small-vs-large-language-models": [],
  "nextjs-16-cache-components": [[
    "The [Next.js blog](https://nextjs.org/blog) has the release notes.",
    "The [Next.js 16 release notes](https://nextjs.org/blog/next-16) detail the changes.",
  ]],
};

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Connected server credentials are required");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const changes = [];
  for (const [slug, replacements] of Object.entries(corrections)) {
    const { data: post, error } = await db.from("blog_posts").select("id, updated_at, content, summary")
      .eq("slug", slug).eq("status", "published").single();
    if (error || !post?.updated_at) throw new Error(`${slug}: published article unavailable`);
    let content = post.content;
    for (const [before, after] of replacements) {
      if (content.includes(after) && !content.includes(before)) continue;
      if (content.split(before).length !== 2) throw new Error(`${slug}: expected passage changed; review before updating`);
      content = content.replace(before, after);
    }
    if (slug === "small-vs-large-language-models") {
      const diagram = content.match(/^!\[Routing diagram[^\n]*\]\(https:\/\/res\.cloudinary\.com\/[^\n]*small-vs-large-language-models-route-escalate\.webp "[^\n]*"\)$/gm);
      if (diagram?.length !== 1) throw new Error(`${slug}: managed diagram missing or ambiguous`);
      const oldPosition = `\n\n${diagram[0]}\n\n## Key takeaways`;
      const explanation = "The check can be a schema validation, a confidence threshold, or a business rule. It is what keeps the cheap path honest.";
      const newPosition = `${explanation}${content.includes(`${explanation}\r\n\r\n`) ? "\r\n\r\n" : "\n\n"}`;
      if (content.includes(oldPosition)) {
        if (!content.includes(newPosition)) throw new Error(`${slug}: target explanation changed`);
        content = content.replace(oldPosition, "\n\n## Key takeaways")
          .replace(newPosition, `${newPosition}${diagram[0]}\n\n`);
      } else if (!content.includes(`${newPosition}${diagram[0]}`)) {
        throw new Error(`${slug}: diagram position changed; review manually`);
      }
    }
    let summary = post.summary;
    if (slug === "zero-trust-networking-cloud") {
      const before = "How zero trust networking works for cloud apps: policy decision and enforcement points, workload identity, microsegmentation, and a default-deny example you can run.";
      const after = "How zero trust networking works for cloud apps: policy decision and enforcement points, workload identity, microsegmentation, and a default-deny Kubernetes policy to adapt safely.";
      if (summary === before) summary = after;
      else if (summary !== after) throw new Error(`${slug}: summary changed; review before updating`);
    }
    if (content !== post.content || summary !== post.summary) changes.push({ slug, id: post.id, updatedAt: post.updated_at, content, summary });
  }
  if (!process.argv.includes("--apply")) {
    console.log(`Dry run: ${changes.length} published articles need editorial corrections.`);
    return;
  }
  for (const change of changes) {
    const { data, error } = await db.from("blog_posts").update({ content: change.content, summary: change.summary, updated_at: new Date().toISOString() })
      .eq("id", change.id).eq("updated_at", change.updatedAt).eq("status", "published").select("id");
    if (error || data?.length !== 1) throw new Error(`${change.slug}: changed concurrently or update failed`);
    console.log(`${change.slug}: reviewed copy saved`);
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Editorial review failed"); process.exitCode = 1; });
