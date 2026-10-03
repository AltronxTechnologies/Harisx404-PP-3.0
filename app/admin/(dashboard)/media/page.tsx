"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Copy, Loader2, Image as ImageIcon, Check, X } from "lucide-react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  secure_url?: string;
  public_id: string;
  alt_text: string | null;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalMedia, setTotalMedia] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (offset = 0) => {
    if (offset) {
      setIsLoadingMore(true);
      setMessage({ type: "", text: "" });
    }
    try {
      const res = await fetch(`/api/admin/media?limit=100&offset=${offset}`);
      if (!res.ok) throw new Error("Media could not be loaded");
      const json = await res.json();
      if (!Array.isArray(json.data)) throw new Error("Invalid media response");
      setMedia((current) => offset ? [...current, ...json.data] : json.data);
      setTotalMedia(Number.isSafeInteger(json.count) && json.count >= 0 ? json.count : json.data.length);
      setLoadFailed(false);
      return true;
    } catch (err) {
      console.error("Failed to fetch media:", err);
      if (offset) setMessage({ type: "error", text: "More images could not be loaded. Try again." });
      else setLoadFailed(true);
      return false;
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const refreshed = await fetchMedia();
      setMessage(refreshed
        ? { type: "success", text: "Image uploaded successfully!" }
        : { type: "warning", text: "Image uploaded, but the library could not refresh. Retry loading to find it." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.secure_url || item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setMessage({ type: "error", text: "Could not copy the image URL. Try again." });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Media Library</h1>
          <p className="text-sm text-text-secondary mt-1">{loadFailed ? "Library unavailable" : `Showing ${media.length} of ${totalMedia} file${totalMedia !== 1 ? "s" : ""} stored on Cloudinary`}</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/tiff,image/bmp,image/x-icon"
            onChange={handleUpload}
            className="hidden"
            id="upload-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Image</>
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div role={message.type === "error" ? "alert" : "status"} className={`flex items-center justify-between rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : message.type === "warning" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: "", text: "" })} aria-label="Dismiss notification" className="flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : loadFailed ? (
        <div role="alert" className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border-primary p-5 text-center text-sm text-text-secondary">
          Media could not be loaded. No files have been removed.
          <button type="button" onClick={() => { setIsLoading(true); fetchMedia(); }} className="inline-flex min-h-11 items-center rounded-full border border-border-primary px-5 font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">Retry loading</button>
        </div>
      ) : media.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border-primary/50 text-text-secondary">
          <ImageIcon className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-medium">No media yet</p>
            <p className="text-sm">Upload an image to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border-primary/50 bg-bg-primary shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={item.secure_url || item.url}
                  alt={item.alt_text || "Uploaded image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>

              {/* Keep the action available on touch and keyboard, not only on hover. */}
              <div className="absolute right-2 top-2 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => copyUrl(item)}
                  aria-label={`Copy URL for ${item.alt_text || "image"}`}
                  className="flex size-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  {copiedId === item.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Filename */}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-text-primary">{item.alt_text || item.public_id.split("/").pop() || "Image"}</p>
                <p className="text-xs text-text-secondary">{formatBytes(item.bytes)}</p>
              </div>
            </div>
            ))}
          </div>
          {media.length < totalMedia && (
            <div className="flex justify-center">
              <button type="button" disabled={isLoadingMore} onClick={() => fetchMedia(media.length)} className="inline-flex min-h-11 items-center rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50">
                {isLoadingMore ? "Loading images..." : "Load more images"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
