import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { FALLBACK_RESUME, RESUME_STORAGE_BUCKET } from "@/app/data/resume";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  const cleaned = value
    .replace(/[\r\n"\\/]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180);
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned || "resume"}.pdf`;
}

function disposition(filename: string, download: boolean) {
  const safe = safeFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, "-");
  return `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function pdfResponse(
  body: BodyInit,
  filename: string,
  size: number,
  download: boolean,
) {
  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": disposition(filename, download),
      "Content-Length": String(size),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function fallbackResponse(download: boolean) {
  const bytes = await readFile(path.join(process.cwd(), "public", FALLBACK_RESUME.path));
  return pdfResponse(bytes, FALLBACK_RESUME.filename, bytes.byteLength, download);
}

export async function GET(request: Request) {
  const download = new URL(request.url).searchParams.get("download") === "1";

  try {
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("resume_document")
      .select("is_configured, storage_path, original_filename, size_bytes")
      .eq("id", true)
      .maybeSingle();

    if (error && /relation|does not exist|schema cache|not find/i.test(error.message)) {
      return fallbackResponse(download);
    }
    if (error) throw error;
    if (!data || !data.is_configured) return fallbackResponse(download);
    if (!data.storage_path || !data.original_filename || !data.size_bytes) {
      return NextResponse.json({ error: "No Resume is currently published." }, { status: 404 });
    }

    const { data: file, error: storageError } = await db.storage
      .from(RESUME_STORAGE_BUCKET)
      .download(data.storage_path);
    if (storageError || !file) throw storageError || new Error("Resume file is unavailable");

    const bytes = await file.arrayBuffer();
    return pdfResponse(bytes, data.original_filename, bytes.byteLength, download);
  } catch (error) {
    console.error("Resume file request failed", error);
    return NextResponse.json({ error: "The Resume file is unavailable." }, { status: 503 });
  }
}
