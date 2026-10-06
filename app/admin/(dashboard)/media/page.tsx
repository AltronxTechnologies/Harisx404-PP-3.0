"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Image as ImageIcon, Loader2, Pencil, Trash2, Upload, X } from "lucide-react";
import { AdminConfirmDialog } from "@/app/components/admin/AdminConfirmDialog";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

const PAGE_SIZE = 12;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif", "image/tiff", "image/bmp", "image/x-icon"]);

interface MediaItem {
  id: string;
  url: string;
  secure_url: string | null;
  public_id: string;
  original_filename?: string | null;
  alt_text: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
}

function displayName(item: MediaItem) {
  return item.original_filename || item.alt_text || `${item.public_id.split("/").pop() || "Image"}${item.format ? `.${item.format}` : ""}`;
}

function formatBytes(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalMedia, setTotalMedia] = useState(0);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaItem | null>(null);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "" | "success" | "warning" | "error"; text: string }>({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/media?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`);
        const result = await readAdminResponse(res, "Media library");
        if (!res.ok || !Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count < 0) throw new Error("Media could not be loaded");
        if (!active) return;
        if (page > 1 && (page - 1) * PAGE_SIZE >= result.count) {
          setPage(Math.max(1, Math.ceil(result.count / PAGE_SIZE)));
          return;
        }
        setMedia(result.data);
        setTotalMedia(result.count);
      } catch {
        if (active) setLoadFailed(true);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page, revision]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const supported = supportedTypes.has(file.type) || (file.type === "" && /\.(?:jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|ico)$/i.test(file.name));
    if (!supported || /\.svgz?$/i.test(file.name) || !file.name || file.size < 1 || file.size > MAX_UPLOAD_BYTES || file.name.length > 255) {
      setMessage({ type: "error", text: "Choose a supported, nonempty image under 20 MB with a filename of 255 characters or fewer. SVG is not accepted." });
      event.target.value = "";
      return;
    }
    setIsUploading(true);
    setMessage({ type: "", text: "" });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body });
      const result = await readAdminResponse(res, "Image upload");
      if (!res.ok) throw new Error(result.error || "Image upload could not be confirmed. Check Cloudinary before retrying.");
      if (!result.data?.id) throw new Error("Image upload returned no library record. Check Cloudinary before retrying.");
      setMessage(result.warning ? { type: "warning", text: result.warning } : { type: "success", text: "Image uploaded to Cloudinary and added to the library." });
      if (page === 1) setRevision((value) => value + 1);
      else setPage(1);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Image upload could not be confirmed. Check the library before retrying." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (item: MediaItem) => {
    const url = item.secure_url || item.url;
    try {
      if (!url) throw new Error("Missing image URL");
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      setCopiedId(item.id);
      setMessage({ type: "", text: "" });
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      setMessage({ type: "error", text: "Could not copy the image link. Check clipboard permissions and try again." });
    }
  };

  const deleteMedia = async (typed: string) => {
    const item = confirming;
    if (!item || typed !== "DELETE" || deletingId) return;
    setDeletingId(item.id);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const result = await readAdminResponse(res, "Image deletion");
      if (!res.ok) throw new Error(result.error || "Image could not be deleted. Check its status before retrying.");
      if (result.success !== true) throw new Error("Image deletion could not be confirmed. Refresh the library before retrying.");
      setConfirming(null);
      setMessage({ type: "success", text: "Image deleted from the library and Cloudinary." });
      if (media.length === 1 && page > 1) setPage(page - 1);
      else setRevision((value) => value + 1);
    } catch (error) {
      setConfirming(null);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Image deletion could not be confirmed. Refresh the library before retrying." });
    } finally {
      setDeletingId(null);
    }
  };

  const saveDescription = async () => {
    if (!editing || isSavingDescription) return;
    const description = descriptionDraft.trim();
    if (!description || description.length > 160) {
      setDescriptionError("Enter a description of 1 to 160 characters.");
      return;
    }
    setIsSavingDescription(true);
    setDescriptionError("");
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, alt_text: description }),
      });
      const result = await readAdminResponse(res, "Image description");
      if (!res.ok) throw new Error(result.error || "Image description could not be saved.");
      if (result.data?.id !== editing.id) throw new Error("Description update could not be confirmed. Refresh the library before retrying.");
      setEditing(null);
      setMessage(editing.original_filename
        ? { type: "success", text: "Image description updated." }
        : { type: "warning", text: "Description updated. This file has no separately recorded original filename, so its stored label changed." });
      setRevision((value) => value + 1);
    } catch (error) {
      setDescriptionError(error instanceof Error ? error.message : "Image description could not be confirmed. Refresh before retrying.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const pages = Math.max(1, Math.ceil(totalMedia / PAGE_SIZE));
  const openPage = (target: number) => {
    setCopiedId(null);
    setMessage({ type: "", text: "" });
    setPage(target);
  };

  return <div className="flex min-w-0 flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight text-ink-primary">Media Library</h1><p className="mt-1 text-sm text-ink-secondary">Cloudinary images used throughout your content. Delete only after removing every reference.</p></div>
      <div>
        <input ref={fileInputRef} id="upload-input" type="file" tabIndex={-1} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/tiff,image/bmp,image/x-icon" onChange={handleUpload} className="sr-only" aria-label="Choose an image to upload" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || deletingId !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-50">{isUploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}{isUploading ? "Uploading..." : "Upload image"}</button>
      </div>
    </header>
    <p className="text-xs text-ink-secondary">JPG, PNG, WebP, GIF, AVIF, HEIC, TIFF, BMP or ICO; 20 MB maximum. Uploaded images enter the shared library immediately.</p>
    {message.text && <div role={message.type === "error" || message.type === "warning" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${message.type === "success" ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200" : message.type === "warning" ? "border-amber-500/30 bg-amber-950/20 text-amber-200" : "border-red-500/30 bg-red-950/20 text-red-200"}`}><span>{message.text}</span><button type="button" onClick={() => setMessage({ type: "", text: "" })} aria-label="Dismiss notification" className="flex size-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"><X aria-hidden className="size-4" /></button></div>}
    <section aria-labelledby="media-list-heading" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="media-list-heading" className="text-base font-semibold text-ink-primary">Image collection</h2><p role="status" className="text-sm text-ink-secondary">{loadFailed ? "Library unavailable" : isLoading ? "Loading images..." : totalMedia === 0 ? "0 files" : `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + media.length} of ${totalMedia} files`}</p></div>
      {isLoading ? <p role="status" className="flex min-h-44 items-center justify-center gap-3 rounded-2xl border border-border-hairline bg-surface-raised text-sm text-ink-secondary"><Loader2 aria-hidden className="size-5 animate-spin" />Loading images...</p>
        : loadFailed ? <div role="alert" className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 text-center text-sm text-red-200">Media could not be loaded. No files were removed.<button type="button" onClick={() => setRevision((value) => value + 1)} className="min-h-11 rounded-xl border border-border-hairline px-5 font-medium text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">Retry loading</button></div>
          : media.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-hairline bg-surface-raised p-5 text-center text-ink-secondary"><ImageIcon aria-hidden className="size-10" /><p className="font-medium">No media yet</p><p className="text-sm">Upload an image to build the library.</p></div>
            : <div className="grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{media.map((item) => {
              const name = displayName(item);
              const url = item.secure_url || item.url;
              return <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-hairline bg-surface-raised shadow-sm">
                <div className="relative aspect-[4/3] bg-surface-base"><Image src={url} alt={item.alt_text || name} fill sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-contain" /></div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-ink-secondary">{item.original_filename ? "Original filename" : "Stored label (original name unverified)"}</p><p className="mt-1 text-sm font-semibold text-ink-primary" style={{ overflowWrap: "anywhere" }}>{name}</p>{item.original_filename && item.alt_text && item.alt_text !== item.original_filename && <p className="mt-2 text-xs text-ink-secondary" style={{ overflowWrap: "anywhere" }}>Description: {item.alt_text}</p>}</div>
                  <dl className="grid grid-cols-2 gap-2 border-t border-border-hairline pt-3 text-xs"><div><dt className="text-ink-secondary">File size</dt><dd className="mt-1 font-medium text-ink-primary">{formatBytes(item.bytes)}{item.bytes !== null && Number.isFinite(item.bytes) && item.bytes >= 0 && <span className="block font-normal text-ink-secondary">{item.bytes.toLocaleString()} bytes</span>}</dd></div><div><dt className="text-ink-secondary">Dimensions</dt><dd className="mt-1 font-medium text-ink-primary">{item.width && item.height ? `${item.width} × ${item.height}px` : "Unavailable"}</dd></div></dl>
                  <button type="button" onClick={() => { setEditing(item); setDescriptionDraft(item.alt_text || ""); setDescriptionError(""); }} disabled={isUploading || deletingId !== null} aria-label={`Edit description for ${name}`} className="inline-flex min-h-11 items-center justify-start gap-2 rounded-xl text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50"><Pencil aria-hidden className="size-4" />Edit description</button>
                  <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border-hairline pt-3">
                    <button type="button" onClick={() => void copyUrl(item)} aria-label={`Copy link for ${name}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-hairline px-2 text-xs font-medium text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current">{copiedId === item.id ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}{copiedId === item.id ? "Copied" : "Copy link"}<span role="status" className="sr-only">{copiedId === item.id ? "Link copied to clipboard" : ""}</span></button>
                    <button type="button" onClick={() => setConfirming(item)} disabled={deletingId !== null || isUploading} aria-label={`Delete ${name}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-2 text-xs font-medium text-red-300 hover:bg-red-950/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50">{deletingId === item.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}Delete</button>
                  </div>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1 text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink-primary">Open image<ExternalLink aria-hidden className="size-3" /></a>
                </div>
              </article>;
            })}</div>}
      {!isLoading && !loadFailed && pages > 1 && <nav aria-label="Media pages" className="flex items-center justify-between gap-3 text-sm"><button type="button" onClick={() => openPage(page - 1)} disabled={page <= 1} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 text-ink-primary disabled:opacity-50"><ChevronLeft aria-hidden className="size-4" />Previous</button><span className="text-ink-secondary">Page {page} of {pages}</span><button type="button" onClick={() => openPage(page + 1)} disabled={page >= pages} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 text-ink-primary disabled:opacity-50">Next<ChevronRight aria-hidden className="size-4" /></button></nav>}
    </section>
    <Dialog open={editing !== null} onClose={() => { if (!isSavingDescription) setEditing(null); }} className="fixed inset-0 z-[7000] dark">
      <div aria-hidden="true" className="fixed inset-0 bg-black/75" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl border border-white/15 bg-[#1b1b1f] p-5 text-white shadow-2xl sm:p-6">
          <DialogTitle className="text-xl font-semibold">Edit image description</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#b5b5bd]">Update the shared accessibility description used by other content. This does not rename the Cloudinary asset.</DialogDescription>
          {!editing?.original_filename && <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">This file has no separately recorded original filename. Editing the description will replace its stored label.</p>}
          <label htmlFor="media-description" className="mt-5 block text-sm font-medium">Image description</label>
          <textarea id="media-description" autoFocus value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} maxLength={160} rows={3} disabled={isSavingDescription} aria-invalid={Boolean(descriptionError)} aria-describedby={descriptionError ? "media-description-error" : undefined} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/30 bg-[#101013] px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70" />
          <p className="mt-1 text-right text-xs text-[#b5b5bd]">{descriptionDraft.length}/160</p>
          {descriptionError && <p id="media-description-error" role="alert" className="mt-2 text-sm text-red-300">{descriptionError}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditing(null)} disabled={isSavingDescription} className="min-h-11 rounded-full border border-white/25 px-5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50">Cancel</button><button type="button" onClick={() => void saveDescription()} disabled={isSavingDescription || !descriptionDraft.trim()} className="min-h-11 rounded-full bg-white px-5 text-sm font-medium text-[#101013] hover:bg-[#dedee2] disabled:opacity-50">{isSavingDescription ? "Saving..." : "Save description"}</button></div>
        </DialogPanel>
      </div>
    </Dialog>
    <AdminConfirmDialog open={confirming !== null} title="Permanently delete image?" description={confirming ? `“${displayName(confirming)}” will be removed from the library and Cloudinary. Known Blog, Project, Testimonial, Experience and Certification uses are blocked, but untracked references may break. This cannot be undone.` : ""} confirmLabel="Delete permanently" confirmText="DELETE" destructive pending={deletingId !== null} onClose={() => setConfirming(null)} onConfirm={(value) => void deleteMedia(value)} />
  </div>;
}
