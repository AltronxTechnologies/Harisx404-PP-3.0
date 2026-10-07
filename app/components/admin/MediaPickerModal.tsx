"use client";

import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Check, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

interface MediaItem {
  id: string;
  url: string;
  secure_url: string;
  alt_text?: string;
  original_filename?: string;
  format?: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => boolean | void;
  initialTab?: "library" | "upload";
  blogPostId?: string;
  libraryOnly?: boolean;
  onUploaded?: (media: MediaItem) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, initialTab = "library", blogPostId, libraryOnly = false, onUploaded, onUploadingChange }: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalMedia, setTotalMedia] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const libraryTabRef = useRef<HTMLButtonElement>(null);
  const uploadTabRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => (initialTab === "upload" && !libraryOnly ? uploadTabRef : libraryTabRef).current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, initialTab, libraryOnly]);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      setSelectionError("");
      setActiveTab(libraryOnly ? "library" : initialTab);
      setUploadError("");
      setUploadWarning("");
      fetchMedia(0);
    }
  }, [isOpen, initialTab, libraryOnly]);

  const fetchMedia = async (offset: number) => {
    if (offset) setIsLoadingMore(true);
    else setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media?limit=50&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      const { data, count } = await readAdminResponse(res, "Media library");
      setMedia((current) => offset ? [...current, ...(data || [])] : data || []);
      setTotalMedia(count ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSelect = () => {
    const selected = media.find((m) => m.id === selectedId);
    if (selected) {
      if (onSelect(selected) === false) {
        setSelectionError("This image cannot be selected here. Choose another or review the image limit.");
        return;
      }
      setSelectionError("");
      onClose();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadError("");
    setUploadWarning("");

    const formData = new FormData();
    formData.append("file", file);
    if (blogPostId) formData.append("blog_post_id", blogPostId);

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const { data, error, warning } = await readAdminResponse(res, "Image upload");
      if (!res.ok) throw new Error(error || "Failed to upload image");
      if (!data?.id) throw new Error("Image upload returned no library record. Check Cloudinary before retrying.");
      setUploadWarning(warning || "");
      onUploaded?.(data);
      
      // Add the new image to the library and select it
      setMedia((current) => [data, ...current]);
      setTotalMedia((count) => count + 1);
      setSelectedId(data.id);
      setActiveTab("library");
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Choose an image" className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-surface-raised rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-border-hairline">
          <div className="flex gap-4">
            <button
              ref={libraryTabRef}
              type="button"
              onClick={() => setActiveTab("library")}
              className={`text-lg font-semibold flex min-h-11 items-center gap-2 transition-colors ${
                activeTab === "library" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ImageIcon className="h-5 w-5" /> Library
            </button>
            {!libraryOnly && <button
              ref={uploadTabRef}
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`text-lg font-semibold flex min-h-11 items-center gap-2 transition-colors ${
                activeTab === "upload" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <UploadCloud className="h-5 w-5" /> Upload
            </button>}
          </div>
          <button type="button" aria-label="Close media picker" onClick={onClose} className="flex size-11 items-center justify-center hover:bg-surface-base rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-surface-base">
          {activeTab === "library" ? (
            isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 text-red-500">
                {error}
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-ink-secondary">
                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                <p>No media found.</p>
                <p className="text-sm opacity-70">{libraryOnly ? "Upload images in the post workspace first." : "Upload an image to get started."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.alt_text || "Select media image"}
                    aria-pressed={selectedId === item.id}
                     onClick={() => { setSelectedId(item.id); setSelectionError(""); }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-signal ${
                      selectedId === item.id ? "border-accent-signal" : "border-transparent hover:border-border-hairline"
                    }`}
                  >
                    <Image
                      src={item.secure_url || item.url}
                      alt={item.alt_text || "Media item"}
                      className="w-full h-full object-cover"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                    {selectedId === item.id && (
                      <div className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-accent-signal text-white shadow-sm">
                        <Check className="size-5" />
                      </div>
                    )}
                  </button>
                  ))}
                </div>
                {media.length < totalMedia && <button type="button" disabled={isLoadingMore} onClick={() => fetchMedia(media.length)} className="mx-auto block min-h-11 rounded-xl border border-border-hairline px-4 text-sm text-text-primary hover:bg-surface-raised disabled:opacity-50">{isLoadingMore ? "Loading images..." : "Load more images"}</button>}
              </div>
            )
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-hairline bg-surface-raised px-4 py-8 sm:min-h-80">
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 text-accent-signal">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p className="font-medium">Uploading image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-sm text-center">
                  <UploadCloud className="h-12 w-12 text-ink-secondary mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Upload New Image</h3>
                    <p className="text-sm text-text-secondary mb-6">Select an image from your computer to upload to the media library (20 MB maximum).</p>
                  
                  {uploadError && (
                    <div className="mb-4 text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg w-full">
                      {uploadError}
                    </div>
                  )}

                  <label className="inline-flex min-h-11 cursor-pointer items-center px-6 py-3 bg-accent-signal text-white rounded-xl text-sm font-medium shadow-sm hover:bg-accent-signal/90 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text-primary">
                    Choose File
                    <input type="file" className="sr-only" accept="image/*,.heic,.heif,.tif,.tiff,.bmp" onChange={handleUpload} />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {uploadWarning && <p role="alert" className="border-t border-amber-500/30 bg-amber-950/20 px-4 py-2 text-sm text-amber-200">{uploadWarning}</p>}
        {selectionError && <p role="alert" className="border-t border-border-hairline px-4 py-2 text-sm text-red-300">{selectionError}</p>}
        <div className="p-4 border-t border-border-hairline bg-surface-raised flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-base transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSelect}
            disabled={!selectedId}
            className="min-h-11 px-6 py-2 bg-accent-signal text-white rounded-xl text-sm font-medium shadow-sm hover:bg-accent-signal/90 disabled:opacity-50 transition-colors"
          >
            Select Image
          </button>
        </div>
      </div>
    </div>
  );
}
