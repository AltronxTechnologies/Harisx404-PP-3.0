/**
 * Seed: one extra gallery image per project (project_images + media).
 * Gives every project ≥2 images so the homepage hover deck has a second
 * shot to reveal. Idempotent: media upserted on public_id; links checked
 * before insert. Owner replaces with real screenshots via admin later.
 *
 * Run: node --env-file=.env.local scripts/seed-project-gallery.mjs
 */
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

/* slug → second (hover) image */
const gallery = {
  "intrushield-nids": img("photo-1551434678-e076c223a692"),
  "packetvision-network-sniffer": img("photo-1544197150-b99a580bb7a8"),
  "medicalink-hms": img("photo-1538108149393-fbbd81895907"),
  "taskflow-workspace": img("photo-1531403009284-440f080d1e12"),
  "neurodoc-ai-assistant": img("photo-1555949963-aa79dcee981c"),
  "visionforge-ml-studio": img("photo-1526628953301-3e589a6a8b74"),
};

for (const [slug, url] of Object.entries(gallery)) {
  const { data: proj, error: pe } = await s
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .single();
  if (pe) throw new Error(`${slug}: ${pe.message}`);

  const { data: media, error: me } = await s
    .from("media")
    .upsert(
      {
        public_id: `seed/${slug}-alt`,
        url,
        secure_url: url,
        format: "jpg",
        alt_text: `${slug} — secondary screenshot`,
        folder: "seed",
      },
      { onConflict: "public_id" }
    )
    .select("id")
    .single();
  if (me) throw new Error(`media ${slug}: ${me.message}`);

  const { data: existing } = await s
    .from("project_images")
    .select("id")
    .eq("project_id", proj.id)
    .eq("media_id", media.id)
    .maybeSingle();
  if (!existing) {
    const { error: le } = await s
      .from("project_images")
      .insert({ project_id: proj.id, media_id: media.id, display_order: 1 });
    if (le) throw new Error(`link ${slug}: ${le.message}`);
  }
  console.log(`✓ ${slug}`);
}
console.log("Done — every project now has a second gallery image.");
