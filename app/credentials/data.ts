import "server-only";

import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import type { CertificationRow } from "@/app/lib/utils";

const loadCredentialCollection = async (): Promise<CertificationRow[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) throw new Error("Credential data is unavailable.");
  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("issue_date", { ascending: false });
  if (error) throw new Error(`Unable to load credentials: ${error.message}`);

  return (data || []).map((row): CertificationRow => ({
    id: row.id,
    title: row.title || "",
    issuer: row.issuer || "",
    issue_date: row.issue_date || "",
    credential_url: row.credential_url || null,
    issuer_logo_url: row.issuer_logo_url || null,
    badge_image_url: row.badge_image_url || null,
    credential_id: row.credential_id || null,
    expiration_date: row.expiration_date || null,
    does_not_expire: row.does_not_expire !== false,
    description: row.description || "",
    skills: Array.isArray(row.skills) ? row.skills.filter((value): value is string => typeof value === "string") : [],
    category: row.category || "Other",
    is_demo: row.is_demo === true,
  }));
};

export const fetchCredentialCollection = unstable_cache(
  loadCredentialCollection,
  ["credential-collection-v4"],
  { revalidate: 3600, tags: ["credentials"] },
);
