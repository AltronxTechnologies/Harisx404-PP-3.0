import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

/**
 * Find-or-create each tag by name, then replace the entity's tag links in
 * the given join table. Uses the service-role client because the `tags` and
 * join tables have no RLS write policies for authenticated sessions (writes
 * with the session client fail silently). Callers MUST verify auth first.
 *
 * Best-effort: logs and swallows errors so a tag hiccup never fails the
 * main create/update mutation.
 */
export async function syncTags({
  joinTable,
  entityColumn,
  entityId,
  tags,
}: {
  joinTable: "project_tags" | "blog_post_tags";
  entityColumn: "project_id" | "blog_post_id";
  entityId: string;
  tags: unknown;
}) {
  if (!Array.isArray(tags)) return;
  try {
    const admin = await createSupabaseAdminClient();

    // Replace-all semantics: clear existing links, then re-link.
    await admin.from(joinTable).delete().eq(entityColumn, entityId);

    for (const raw of tags) {
      if (typeof raw !== "string" || !raw.trim()) continue;
      const name = raw.trim();

      let { data: tag } = await admin
        .from("tags")
        .select("id")
        .eq("name", name)
        .single();

      if (!tag) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        const { data: newTag } = await admin
          .from("tags")
          .insert({ name, slug })
          .select("id")
          .single();
        if (newTag) tag = newTag;
      }

      if (tag) {
        await admin.from(joinTable).insert({ [entityColumn]: entityId, tag_id: tag.id });
      }
    }
  } catch (e) {
    console.error(`Tag sync failed for ${joinTable}:`, e);
  }
}
