import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { RESUME_STORAGE_BUCKET } from "@/app/data/resume";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { resumeGrantSchema, validResumeGrant } from "@/app/lib/admin/resume-upload-grant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const parsed = resumeGrantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validResumeGrant(parsed.data)) return NextResponse.json({ error: "Upload authorization expired or is invalid. Choose the PDF again." }, { status: 400 });
  const grant = parsed.data;

  try {
    const db = await createSupabaseAdminClient();
    const { data: current, error: currentError } = await db.from("resume_document")
      .select("storage_path, original_filename, size_bytes, updated_at").eq("id", true).single();
    if (currentError || !current) throw currentError || new Error("Resume status unavailable");
    if (current.storage_path === grant.path) return NextResponse.json({ data: {
      isConfigured: true, isActive: true, filename: current.original_filename,
      mimeType: "application/pdf", sizeBytes: Number(current.size_bytes), updatedAt: current.updated_at,
    } });
    if (current.updated_at !== grant.expectedUpdatedAt || current.storage_path !== grant.expectedPath) {
      return NextResponse.json({ error: "Resume changed in another session. Reload before replacing it. The unused private upload may need manual cleanup." }, { status: 409 });
    }
    const storage = db.storage.from(RESUME_STORAGE_BUCKET);
    const { data: file, error: downloadError } = await storage.download(grant.path);
    if (downloadError || !file) return NextResponse.json({ error: "The PDF did not reach private Storage. Choose it again." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength !== grant.sizeBytes || new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") {
      return NextResponse.json({ error: "PDF verification failed. The public Resume was not changed; review the pending private upload for cleanup." }, { status: 400 });
    }

    let mutation = db.from("resume_document").update({
      is_configured: true, storage_path: grant.path, original_filename: grant.filename,
      mime_type: "application/pdf", size_bytes: bytes.byteLength,
    }).eq("id", true).eq("updated_at", grant.expectedUpdatedAt);
    mutation = grant.expectedPath ? mutation.eq("storage_path", grant.expectedPath) : mutation.is("storage_path", null);
    const { data: saved, error: updateError } = await mutation.select("original_filename, size_bytes, updated_at").maybeSingle();
    if (updateError || !saved) {
      if (updateError) throw updateError;
      const { data: winner } = await db.from("resume_document").select("storage_path, original_filename, size_bytes, updated_at").eq("id", true).maybeSingle();
      if (winner?.storage_path === grant.path) return NextResponse.json({ data: {
        isConfigured: true, isActive: true, filename: winner.original_filename,
        mimeType: "application/pdf", sizeBytes: Number(winner.size_bytes), updatedAt: winner.updated_at,
      } });
      return NextResponse.json({ error: "Resume changed in another session. Reload before replacing it. The unused private upload may need manual cleanup." }, { status: 409 });
    }

    let warning = "";
    if (grant.expectedPath && grant.expectedPath !== grant.path) {
      const { error: cleanupError } = await storage.remove([grant.expectedPath]);
      if (cleanupError) warning = "Previous private PDF could not be removed. Review Storage cleanup.";
    }
    try {
      revalidateTag("resume");
      revalidatePath("/resume");
      revalidatePath("/resume/file");
    } catch {
      warning += `${warning ? " " : ""}New PDF is saved, but the public page may take up to an hour to refresh.`;
    }
    return NextResponse.json({ data: {
      isConfigured: true, isActive: true, filename: saved.original_filename,
      mimeType: "application/pdf", sizeBytes: Number(saved.size_bytes), updatedAt: saved.updated_at,
    }, ...(warning ? { warning } : {}) });
  } catch {
    return NextResponse.json({ error: "The Resume upload could not be finalized. Refresh its status before trying again." }, { status: 500 });
  }
}
