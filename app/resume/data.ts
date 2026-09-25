import "server-only";

import { unstable_cache } from "next/cache";
import { FALLBACK_RESUME, RESUME_FILE_ROUTE } from "@/app/data/resume";
import { getPublicSupabase } from "@/app/lib/supabase/safe";

export type PublicResumeDocument = {
  filename: string;
  sizeBytes: number;
  updatedAt: string;
  fileUrl: string;
  isFallback: boolean;
};

const loadResumeDocument = async (): Promise<PublicResumeDocument | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return {
      filename: FALLBACK_RESUME.filename,
      sizeBytes: FALLBACK_RESUME.sizeBytes,
      updatedAt: FALLBACK_RESUME.updatedAt,
      fileUrl: RESUME_FILE_ROUTE,
      isFallback: true,
    };
  }

  const { data, error } = await supabase
    .from("public_resume_document")
    .select("is_configured, is_active, original_filename, size_bytes, updated_at")
    .maybeSingle();

  if (error && /relation|does not exist|schema cache|not find/i.test(error.message)) {
    return {
      filename: FALLBACK_RESUME.filename,
      sizeBytes: FALLBACK_RESUME.sizeBytes,
      updatedAt: FALLBACK_RESUME.updatedAt,
      fileUrl: RESUME_FILE_ROUTE,
      isFallback: true,
    };
  }
  if (error) throw new Error("Unable to load the Resume document.");
  if (!data || !data.is_configured) {
    return {
      filename: FALLBACK_RESUME.filename,
      sizeBytes: FALLBACK_RESUME.sizeBytes,
      updatedAt: FALLBACK_RESUME.updatedAt,
      fileUrl: RESUME_FILE_ROUTE,
      isFallback: true,
    };
  }
  if (!data.is_active || !data.original_filename || !data.size_bytes) return null;

  return {
    filename: data.original_filename,
    sizeBytes: Number(data.size_bytes),
    updatedAt: data.updated_at,
    fileUrl: RESUME_FILE_ROUTE,
    isFallback: false,
  };
};

export const fetchResumeDocument = unstable_cache(
  loadResumeDocument,
  ["public-resume-document-v1"],
  { revalidate: 3600, tags: ["resume"] },
);
