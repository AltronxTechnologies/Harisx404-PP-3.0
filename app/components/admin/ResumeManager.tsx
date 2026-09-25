"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";

type ResumeStatus = {
  isConfigured: boolean;
  isActive: boolean;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ResumeManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ResumeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/resume", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load Resume settings.");
        setStatus(body.data);
      })
      .catch((error) => setMessage({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/resume", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Resume upload failed.");
      setStatus(body.data);
      setMessage({
        type: "success",
        text: status?.isActive
          ? "Resume replaced. The public page now shows the new PDF."
          : "Resume published. The public page now shows this PDF.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Resume upload failed." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete the active Resume? It will disappear from the public Resume page.")) return;
    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/resume", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Resume deletion failed.");
      setStatus(body.data);
      setMessage({ type: "success", text: "Resume deleted from the public page." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Resume deletion failed." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Resume</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Publish one PDF at a time. Replacing it removes the previous file automatically.
        </p>
      </header>

      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <section aria-labelledby="current-resume-heading" className="rounded-2xl border border-border-primary bg-white p-5 dark:bg-white/[0.02] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              {loading ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
            </span>
            <div className="min-w-0">
              <h2 id="current-resume-heading" className="font-medium text-text-primary">Current Resume</h2>
              {loading ? (
                <p className="mt-1 text-sm text-text-secondary">Loading document status…</p>
              ) : !status ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">Document status is unavailable. Refresh the page to try again.</p>
              ) : status.isActive ? (
                <>
                  <p className="mt-1 break-all text-sm font-medium text-text-primary">{status.filename}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatBytes(status.sizeBytes)} · Updated {formatDate(status.updatedAt)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-text-secondary">No Resume is currently published.</p>
              )}
            </div>
          </div>

          {status?.isActive && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href="/resume/file" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-primary px-3 text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                <ExternalLink className="size-4" /> Preview
              </a>
              <button type="button" onClick={remove} disabled={deleting || uploading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
              </button>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="upload-resume-heading" className="rounded-2xl border border-border-primary bg-white p-5 dark:bg-white/[0.02] sm:p-6">
        <h2 id="upload-resume-heading" className="font-medium text-text-primary">
          {status?.isActive ? "Replace Resume" : "Upload Resume"}
        </h2>
        <p className="mt-1 text-sm leading-5 text-text-secondary">
          PDF only, up to 10 MB. Any page count is supported. The original filename and document bytes are preserved for downloads.
        </p>
        <input ref={inputRef} id="resume-upload" type="file" accept="application/pdf,.pdf" onChange={upload} disabled={!status || loading || uploading || deleting} className="peer sr-only" />
        <label htmlFor="resume-upload" className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 ${!status || loading || uploading || deleting ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : status?.isActive ? "Choose replacement PDF" : "Choose PDF"}
        </label>
      </section>
    </div>
  );
}
