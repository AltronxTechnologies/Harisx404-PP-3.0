import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { RESUME_MAX_BYTES, RESUME_STORAGE_BUCKET } from "@/app/data/resume";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { resumeUploadProof } from "@/app/lib/admin/resume-upload-grant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const parsed = z.object({ filename: z.string().min(1).max(255), sizeBytes: z.number().int().min(1).max(RESUME_MAX_BYTES) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a PDF no larger than 10 MB." }, { status: 400 });

  try {
    const db = await createSupabaseAdminClient();
    const { data: current, error } = await db.from("resume_document")
      .select("storage_path, updated_at").eq("id", true).single();
    if (error || !current) throw error || new Error("Resume state unavailable");
    const stem = parsed.data.filename.replace(/[\r\n"\\/\u0000-\u001f\u007f]/g, "-").replace(/\.pdf$/i, "").trim().slice(0, 176) || "resume";
    const grant = {
      path: `documents/${crypto.randomUUID()}.pdf`,
      filename: `${stem}.pdf`,
      sizeBytes: parsed.data.sizeBytes,
      expectedPath: current.storage_path,
      expectedUpdatedAt: current.updated_at,
      expiresAt: Date.now() + 60 * 60_000,
    };
    const { data: signed, error: signedError } = await db.storage.from(RESUME_STORAGE_BUCKET).createSignedUploadUrl(grant.path);
    if (signedError || !signed?.token) throw signedError || new Error("Upload authorization unavailable");
    return NextResponse.json({ ...grant, proof: resumeUploadProof(grant), token: signed.token });
  } catch {
    return NextResponse.json({ error: "Resume upload could not be prepared. Verify private Storage and the Resume migration." }, { status: 503 });
  }
}
