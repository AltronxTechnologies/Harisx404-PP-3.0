"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Copy, Trash2, Loader2, Image as ImageIcon, Check, X } from "lucide-react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  public_id: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  size: number;
  created_at: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/admin/media?limit=100");
      const json = await res.json();
      setMedia(json.data || []);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setIsLoading(false);
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

      setMessage({ type: "success", text: "Image uploaded successfully!" });
      fetchMedia();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <p className="text-sm text-text-secondary mt-1">{media.length} file{media.length !== 1 ? "s" : ""} stored on Cloudinary</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="upload-input"
          />
          <label
            htmlFor="upload-input"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-all ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Image</>
            )}
          </label>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`flex items-center justify-between rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-red-50 text-red-500 dark:bg-red-950/30"}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border-primary/50 bg-bg-primary shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={item.url}
                  alt={item.filename || "Media"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => copyUrl(item)}
                  title="Copy URL"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {copiedId === item.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Filename */}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-text-primary">{item.filename || "image"}</p>
                <p className="text-xs text-text-secondary">{formatBytes(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
