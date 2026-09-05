import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

type SavedBlogPost = {
  id: string;
  slug: string;
  updated_at: string;
  [key: string]: unknown;
};

/**
 * Saves a Blog post and replaces its tags in one service-role-only database
 * transaction. The route calling this must authenticate and authorize admin.
 */
export async function saveBlogPostWithTags({
  id,
  expectedUpdatedAt,
  post,
  tags,
}: {
  id?: string;
  expectedUpdatedAt?: string;
  post: Record<string, unknown>;
  tags: Array<{ name: string; slug: string }>;
}) {
  const admin = await createSupabaseAdminClient();
  const { data, error } = await admin.rpc("save_blog_post_with_tags", {
    p_id: id ?? null,
    p_expected_updated_at: expectedUpdatedAt ?? null,
    p_post: post,
    p_tags: tags,
  });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Blog save returned an invalid response");
  }

  const result = data as { post?: SavedBlogPost; old_slug?: string | null };
  if (!result.post?.id || !result.post.slug) {
    throw new Error("Blog save returned no post");
  }
  return { post: result.post, old_slug: result.old_slug ?? null };
}

/**
 * Replaces tags for non-Blog entities. Uses service role because authenticated
 * sessions do not have write policies for the shared tag tables.
 */
export async function syncTags({
  joinTable,
  entityColumn,
  entityId,
  tags,
}: {
  joinTable: "project_tags";
  entityColumn: "project_id";
  entityId: string;
  tags: unknown;
}) {
  if (!Array.isArray(tags)) return;

  const admin = await createSupabaseAdminClient();
  const { error: deleteError } = await admin.from(joinTable).delete().eq(entityColumn, entityId);
  if (deleteError) throw deleteError;

  for (const raw of tags) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const name = raw.trim();

    const { data: existingTag, error: selectError } = await admin
      .from("tags")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (selectError) throw selectError;

    let tag = existingTag;
    if (!tag) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const { data: newTag, error: insertTagError } = await admin
        .from("tags")
        .insert({ name, slug })
        .select("id")
        .single();
      if (insertTagError) throw insertTagError;
      if (!newTag) throw new Error("Tag creation returned no tag");
      tag = newTag;
    }

    const { error: linkError } = await admin
      .from(joinTable)
      .insert({ [entityColumn]: entityId, tag_id: tag.id });
    if (linkError) throw linkError;
  }
}
