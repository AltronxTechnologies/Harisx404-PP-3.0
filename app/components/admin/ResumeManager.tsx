"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Download, ExternalLink, FileText, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { FALLBACK_RESUME, RESUME_DOWNLOAD_ROUTE, RESUME_FILE_ROUTE, RESUME_MAX_BYTES } from "@/app/data/resume";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { RESUME_STORAGE_BUCKET } from "@/app/data/resume";

type ResumeStatus = {
  isConfigured: boolean;
  isActive: boolean;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string;
};

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResumeManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ResumeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const loadStatus = async (signal?: AbortSignal) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/resume", { cache: "no-store", signal });
      const body = await readAdminResponse(response, "Resume");
      if (!response.ok) throw new Error(body.error || "Unable to load Resume settings.");
      if (!signal?.aborted) setStatus(body.data);
    } catch (error) {
      if (signal?.aborted) return;
      setStatus(null);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load Resume settings." });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal);
    return () => controller.abort();
  // Status is loaded only once when the workspace opens; Retry initiates a new request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseFile = (file?: File) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file || !status || uploading || deleting) return;
    if (file.size < 1 || file.size > RESUME_MAX_BYTES || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
      setMessage({ type: "error", text: "Choose a PDF between 1 byte and 10 MB." });
      return;
    }
    setMessage(null);
    setPendingFile(file);
  };

  const upload = async () => {
    if (!pendingFile || !status || uploading || deleting) return;
    setUploading(true);
    setMessage(null);
    try {
      const prepared = await fetch("/api/admin/resume/prepare", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: pendingFile.name, sizeBytes: pendingFile.size }),
      });
      const grant = await readAdminResponse(prepared, "Resume");
      if (!prepared.ok) throw new Error(grant.error || "Resume upload could not be prepared.");
      const supabase = getPublicSupabase();
      if (!supabase) throw new Error("Private Storage is unavailable. Check the Resume environment configuration.");
      const pdf = pendingFile.type === "application/pdf" ? pendingFile : new File([pendingFile], pendingFile.name, { type: "application/pdf" });
      const { error: transferError } = await supabase.storage.from(RESUME_STORAGE_BUCKET)
        .uploadToSignedUrl(grant.path, grant.token, pdf, { contentType: "application/pdf", cacheControl: "0", upsert: false });
      if (transferError) {
        throw new Error("PDF transfer failed. Refresh Resume status before retrying. A partial file may remain in private Storage for manual cleanup; the live Resume was not changed.");
      }
      const response = await fetch("/api/admin/resume/finish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: grant.path, filename: grant.filename, sizeBytes: grant.sizeBytes, expectedPath: grant.expectedPath, expectedUpdatedAt: grant.expectedUpdatedAt, expiresAt: grant.expiresAt, proof: grant.proof }),
      });
      const body = await readAdminResponse(response, "Resume");
      if (!response.ok) throw new Error(body.error || "Resume upload failed.");
      setStatus(body.data);
      setPendingFile(null);
      setPreviewOpen(false);
      setMessage(body.warning
        ? { type: "warning", text: body.warning }
        : { type: "success", text: status.isActive ? "Resume replaced. The new PDF is public." : "Resume published. The PDF is now public." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Resume upload failed." });
      setPendingFile(null);
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!status?.isActive || deleting || uploading) return;
    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/resume", { method: "DELETE" });
      const body = await readAdminResponse(response, "Resume");
      if (!response.ok) throw new Error(body.error || "Resume deletion failed.");
      setStatus(body.data);
      setPreviewOpen(false);
      setMessage(body.warning
        ? { type: "warning", text: body.warning }
        : { type: "success", text: "Resume unpublished. No PDF is available on the public page." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Resume deletion failed." });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const fallback = status?.isConfigured === false;
  const hasDocument = Boolean(status?.isActive || fallback);
  const filename = fallback ? FALLBACK_RESUME.filename : status?.filename;
  const size = fallback ? FALLBACK_RESUME.sizeBytes : status?.sizeBytes;
  const busy = uploading || deleting;

  return <div className="mx-auto w-full max-w-5xl space-y-6 text-ink-primary">
    <header className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-secondary">Document manager</p>
      <h1 className="text-3xl font-medium tracking-tight">Resume</h1>
      <p className="max-w-2xl text-sm leading-6 text-ink-secondary">One live PDF at a time. Review it here, open the original, or replace it when a new version is ready.</p>
    </header>

    {message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${message.type === "error" ? "border-red-500/40 bg-red-950/20 text-red-300" : message.type === "warning" ? "border-amber-500/40 bg-amber-950/20 text-amber-200" : "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"}`}>{message.text}</p>}

    <section aria-labelledby="current-resume-heading" className="min-w-0 space-y-5 rounded-2xl border border-border-hairline bg-surface-raised p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border-hairline bg-surface-base text-ink-primary" aria-hidden>{loading ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}</span>
          <div className="min-w-0 space-y-1">
            <h2 id="current-resume-heading" className="text-base font-semibold">Current document</h2>
            {loading ? <p role="status" className="text-sm text-ink-secondary">Loading document status...</p>
              : !status ? <p className="text-sm text-red-300">Document status could not be loaded. No changes were made.</p>
              : hasDocument ? <>
                <p className="break-words text-sm font-medium">{filename}</p>
                <p className="text-xs text-ink-secondary">{size ? formatBytes(size) : "Size unavailable"} / {fallback ? "Bundled fallback PDF currently available to visitors" : `Published ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(status.updatedAt))}`}</p>
              </> : <p className="text-sm text-ink-secondary">No Resume is currently published. Upload a PDF to make one available.</p>}
          </div>
        </div>
        <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 font-mono text-xs uppercase ${hasDocument ? "border-emerald-500/40 text-emerald-200" : "border-border-hairline text-ink-secondary"}`}>{loading ? "Checking" : !status ? "Unavailable" : fallback ? "Legacy fallback" : status.isActive ? "Live PDF" : "No document"}</span>
      </div>
      {!loading && (!status || message?.type === "error" || message?.type === "warning") && <button type="button" onClick={() => void loadStatus()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium hover:bg-surface-base disabled:opacity-50"><RotateCcw className="size-4" aria-hidden />{status ? "Refresh status" : "Retry status"}</button>}
      {status && hasDocument && <div className="flex flex-wrap gap-2 border-t border-border-hairline pt-4">
        <button type="button" aria-expanded={previewOpen} aria-controls="resume-pdf-panel" onClick={() => setPreviewOpen((open) => !open)} className="min-h-11 rounded-xl border border-border-hairline px-4 text-sm font-medium hover:bg-surface-base">{previewOpen ? "Hide PDF preview" : "Show PDF preview"}</button>
        <a href={RESUME_FILE_ROUTE} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium hover:bg-surface-base"><ExternalLink className="size-4" aria-hidden />Open original PDF<span className="sr-only"> in a new tab</span></a>
        <a href={RESUME_DOWNLOAD_ROUTE} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium hover:bg-surface-base"><Download className="size-4" aria-hidden />Download PDF</a>
        {status.isActive && <button type="button" onClick={() => setDeleteOpen(true)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/40 px-4 text-sm font-medium text-red-300 hover:bg-red-950/20 disabled:opacity-50"><Trash2 className="size-4" aria-hidden />Delete live PDF</button>}
      </div>}
      {status && hasDocument && previewOpen && <div id="resume-pdf-panel" role="region" aria-label="Current Resume PDF preview" className="min-w-0 space-y-3 border-t border-border-hairline pt-5">
        <p className="text-xs text-ink-secondary">Previewing the exact public file. PDF controls depend on your browser; use Open original PDF if the embedded viewer is unavailable.</p>
        <iframe key={`${status.updatedAt}-${fallback}`} src={RESUME_FILE_ROUTE} title="Current Resume PDF" loading="lazy" className="h-[420px] w-full rounded-xl border border-border-hairline bg-white sm:h-[680px]" />
      </div>}
    </section>

    <section aria-labelledby="upload-resume-heading" className="min-w-0 space-y-4 rounded-2xl border border-border-hairline bg-surface-raised p-4 sm:p-6">
      <div><h2 id="upload-resume-heading" className="text-base font-semibold">{status?.isActive ? "Replace live PDF" : "Publish a PDF"}</h2><p className="mt-1 text-sm leading-6 text-ink-secondary">PDF only, up to 10 MB. A replacement becomes public after confirmation. The original bytes and filename are preserved for download.</p></div>
      <div onDragOver={(event) => { event.preventDefault(); if (status && !busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`rounded-xl border border-dashed p-5 text-center sm:p-8 ${dragging && status && !busy ? "border-white bg-white/10" : "border-border-hairline bg-surface-base"}`}>
        <Upload className="mx-auto size-6 text-ink-secondary" aria-hidden />
        <p className="mt-3 text-sm text-ink-secondary">Drop a PDF here, or choose one to review before publishing.</p>
        <input ref={inputRef} id="resume-upload" type="file" accept="application/pdf,.pdf" aria-label="Choose Resume PDF" onChange={(event) => chooseFile(event.target.files?.[0])} disabled={!status || loading || busy} className="peer sr-only" />
        <label htmlFor="resume-upload" className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-border-hairline bg-white px-5 text-sm font-medium text-[#101013] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${!status || loading || busy ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#dedee2]"}`}>{uploading ? "Uploading..." : status?.isActive ? "Choose replacement PDF" : "Choose PDF"}</label>
      </div>
      <p className="text-xs text-ink-secondary">The PDF transfers directly to private Storage and is verified before publication. If you cancel before confirmation, the live Resume remains unchanged.</p>
    </section>

    <AdminConfirmDialog open={pendingFile !== null} title={status?.isActive ? "Replace the live Resume?" : "Publish this Resume?"} description={pendingFile ? `${pendingFile.name} (${formatBytes(pendingFile.size)}) will become the only public Resume. ${status?.isActive ? "The previous file will be removed after the new one is saved." : "Visitors will be able to open and download it."}` : ""} confirmLabel={status?.isActive ? "Replace PDF" : "Publish PDF"} pending={uploading} onClose={() => { if (!uploading) setPendingFile(null); }} onConfirm={() => void upload()} />
    <AdminConfirmDialog open={deleteOpen} title="Delete the live Resume?" description="The public Resume page will no longer offer this file. You can publish another PDF later, but deletion cannot be undone." confirmLabel="Delete PDF" confirmText="DELETE" pending={deleting} destructive onClose={() => setDeleteOpen(false)} onConfirm={() => void remove()} />
  </div>;
}
