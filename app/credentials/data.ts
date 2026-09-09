import "server-only";

import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
export type PublicCredential = {
  id: string;
  title: string;
  issuer: string;
  issuer_logo_url: string | null;
  credential_id: string | null;
  credential_url: string | null;
};

const loadCredentialCollection = async (): Promise<PublicCredential[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) throw new Error("Credential data is unavailable.");
  const { data, error } = await supabase
    .from("certifications")
    .select("id, title, issuer, issuer_logo_url, credential_id, credential_url")
    .eq("status", "published")
    .order("display_order", { ascending: true })
  if (error) throw new Error(`Unable to load credentials: ${error.message}`);

  return (data || []).map((row): PublicCredential => ({
    id: row.id,
    title: row.title || "",
    issuer: row.issuer || "",
    credential_url: row.credential_url || null,
    issuer_logo_url: row.issuer_logo_url || null,
    credential_id: row.credential_id || null,
  }));
};

export const fetchCredentialCollection = unstable_cache(
  loadCredentialCollection,
  ["credential-collection-v4"],
  { revalidate: 3600, tags: ["credentials"] },
);
