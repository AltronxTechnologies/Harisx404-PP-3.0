import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  RESUME_MAX_BYTES,
  RESUME_STORAGE_BUCKET,
} from "@/app/data/resume";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

export const runtime = "nodejs";

async function isAdmin() {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && adminEmail && user.email?.trim().toLowerCase() === adminEmail);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function safeFilename(value: string) {
  const cleaned = value
    .replace(/[\r\n"\\/]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180);
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned || "resume"}.pdf`;
}

function invalidateResume() {
  revalidateTag("resume");
  revalidatePath("/resume");
  revalidatePath("/resume/file");
}

function failure(error: unknown) {
  console.error("Admin Resume request failed", error);
  return NextResponse.json(
    { error: "The Resume request could not be completed. Confirm that the Resume migration is applied." },
    { status: 500 },
  );
}

export async function GET() {
  if (!(await isAdmin())) return unauthorized();

  try {
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("resume_document")
      .select("is_configured, original_filename, mime_type, size_bytes, updated_at")
      .eq("id", true)
      .single();
    if (error) throw error;

    return NextResponse.json({
      data: {
        isConfigured: data.is_configured,
        isActive: Boolean(data.original_filename),
        filename: data.original_filename,
        mimeType: data.mime_type,
        sizeBytes: data.size_bytes ? Number(data.size_bytes) : null,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF file to upload." }, { status: 400 });
    }
    if (file.size < 1 || file.size > RESUME_MAX_BYTES) {
      return NextResponse.json(
        { error: "The PDF must be between 1 byte and 10 MB." },
        { status: 400 },
      );
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") {
      return NextResponse.json({ error: "The selected file is not a valid PDF." }, { status: 400 });
    }

    const db = await createSupabaseAdminClient();
    const { data: current, error: currentError } = await db
      .from("resume_document")
      .select("storage_path")
      .eq("id", true)
      .single();
    if (currentError) throw currentError;

    const storagePath = `documents/${crypto.randomUUID()}.pdf`;
    const originalFilename = safeFilename(file.name);
    const { error: uploadError } = await db.storage
      .from(RESUME_STORAGE_BUCKET)
      .upload(storagePath, bytes, {
        cacheControl: "0",
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error: updateError } = await db
      .from("resume_document")
      .update({
        is_configured: true,
        storage_path: storagePath,
        original_filename: originalFilename,
        mime_type: "application/pdf",
        size_bytes: bytes.byteLength,
      })
      .eq("id", true)
      .select("original_filename, size_bytes, updated_at")
      .single();

    if (updateError) {
      await db.storage.from(RESUME_STORAGE_BUCKET).remove([storagePath]);
      throw updateError;
    }

    if (current.storage_path && current.storage_path !== storagePath) {
      const { error: cleanupError } = await db.storage
        .from(RESUME_STORAGE_BUCKET)
        .remove([current.storage_path]);
      if (cleanupError) console.error("Old Resume cleanup failed", cleanupError);
    }

    invalidateResume();
    return NextResponse.json({
      data: {
        isConfigured: true,
        isActive: true,
        filename: data.original_filename,
        mimeType: "application/pdf",
        sizeBytes: Number(data.size_bytes),
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE() {
  if (!(await isAdmin())) return unauthorized();

  try {
    const db = await createSupabaseAdminClient();
    const { data: current, error: currentError } = await db
      .from("resume_document")
      .select("storage_path")
      .eq("id", true)
      .single();
    if (currentError) throw currentError;

    const { data, error: updateError } = await db
      .from("resume_document")
      .update({
        is_configured: true,
        storage_path: null,
        original_filename: null,
        mime_type: null,
        size_bytes: null,
      })
      .eq("id", true)
      .select("updated_at")
      .single();
    if (updateError) throw updateError;

    if (current.storage_path) {
      const { error: storageError } = await db.storage
        .from(RESUME_STORAGE_BUCKET)
        .remove([current.storage_path]);
      if (storageError) console.error("Deleted Resume cleanup failed", storageError);
    }

    invalidateResume();
    return NextResponse.json({
      data: {
        isConfigured: true,
        isActive: false,
        filename: null,
        mimeType: null,
        sizeBytes: null,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
