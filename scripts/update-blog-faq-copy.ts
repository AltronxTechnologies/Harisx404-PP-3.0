import { createClient } from "@supabase/supabase-js";

const corrections: Record<string, Array<[string, string]>> = {
  "securing-ai-agents": [[
    "It is text the model reads and treats as an instruction. In direct injection the user types it. In indirect injection it is hidden in content the agent retrieves, such as a web page, email, or tool output.",
    "Prompt injection is an attempt to make a model follow instructions from lower-trust content instead of its intended task or higher-priority instructions. Direct injection arrives in a user message; indirect injection hides in material the model reads, such as a web page, email, or tool output.",
  ]],
  "ai-security-operations-center": [
    [
      "Current evidence points to reallocation, not replacement. Surveyed teams keep humans reviewing decisions, and the work shifts toward investigation quality, threat hunting, and detection engineering.",
      "Nobody can conclude that from current adoption data. In the cited survey, teams still have humans review AI decisions; AI may shift analysts toward investigation quality, threat hunting, and detection engineering, but long-term staffing effects remain uncertain.",
    ],
    [
      "Silent missed detections, over-automated containment, prompt injection through alert content, and weak audit trails. A human-readable record of every question asked and every query run is the minimum.",
      "Silent missed detections, over-automated containment, prompt injection through alert content, and weak audit trails. Record the evidence and model recommendation, who approved it, the tool actions taken, and their outcomes so an incident can be reconstructed.",
    ],
  ],
  "type-safe-mern-typescript": [[
    "They serve different purposes. The Mongoose schema describes storage and database-level rules. The Zod schema describes the API contract. Keeping them separate, with a mapper between them, avoids leaking storage details.",
    "They serve different purposes. Mongoose schemas define document shape and application-level model validation; Zod schemas validate data at API boundaries and describe the contract. Keep storage documents separate from API DTOs, and map between them so internal fields do not leak.",
  ]],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Connected server credentials are required");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const changes: Array<{ slug: string; id: string; updatedAt: string; content: string }> = [];

  for (const [slug, replacements] of Object.entries(corrections)) {
    const { data, error } = await db.from("blog_posts")
      .select("id, content, updated_at")
      .eq("slug", slug).eq("status", "published").single();
    if (error || !data || !data.updated_at) throw new Error(`${slug}: published row unavailable or missing update timestamp`);
    let content: string = data.content;
    for (const [before, after] of replacements) {
      if (content.includes(after) && !content.includes(before)) continue;
      if (content.split(before).length !== 2) throw new Error(`${slug}: expected wording changed; review before updating`);
      content = content.replace(before, after);
    }
    if (content !== data.content) changes.push({ slug, id: data.id, updatedAt: data.updated_at, content });
  }

  if (!process.argv.includes("--apply")) {
    console.log(`Dry run: ${changes.length} published articles need FAQ corrections.`);
    return;
  }
  for (const change of changes) {
    const { data, error } = await db.from("blog_posts")
      .update({ content: change.content, updated_at: new Date().toISOString() })
      .eq("id", change.id).eq("updated_at", change.updatedAt).eq("status", "published")
      .select("id");
    if (error || data?.length !== 1) throw new Error(`${change.slug}: row changed concurrently or update failed`);
    console.log(`${change.slug}: FAQ wording updated`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "FAQ update failed");
  process.exitCode = 1;
});
