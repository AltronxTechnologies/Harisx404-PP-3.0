"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Check, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  secure_url: string;
  alt_text?: string;
  format?: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/media?limit=50");
      if (!res.ok) throw new Error("Failed to fetch media");
      const { data } = await res.json();
      setMedia(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    const selected = media.find((m) => m.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const { data } = await res.json();
      
      // Add the new image to the library and select it
      setMedia([data, ...media]);
      setSelectedId(data.id);
      setActiveTab("library");
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-surface-raised rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-border-hairline">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("library")}
              className={`text-lg font-semibold flex items-center gap-2 transition-colors ${
                activeTab === "library" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ImageIcon className="h-5 w-5" /> Library
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`text-lg font-semibold flex items-center gap-2 transition-colors ${
                activeTab === "upload" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <UploadCloud className="h-5 w-5" /> Upload
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-base rounded-lg transition-colors">
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
                <p className="text-sm opacity-70">Upload an image to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedId === item.id ? "border-accent-signal" : "border-transparent hover:border-border-hairline"
                    }`}
                  >
                    <Image
                      src={item.secure_url || item.url}
                      alt={item.alt_text || "Media item"}
                      className="w-full h-full object-cover"
                      fill
                    />
                    {selectedId === item.id && (
                      <div className="absolute top-2 right-2 bg-accent-signal text-white p-1 rounded-full shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-border-hairline rounded-2xl bg-surface-raised">
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 text-accent-signal">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p className="font-medium">Uploading to Cloudinary...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-sm text-center">
                  <UploadCloud className="h-12 w-12 text-ink-secondary mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Upload New Image</h3>
                  <p className="text-sm text-text-secondary mb-6">Select an image from your computer to upload to the media library.</p>
                  
                  {uploadError && (
                    <div className="mb-4 text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg w-full">
                      {uploadError}
                    </div>
                  )}

                  <label className="cursor-pointer px-6 py-3 bg-accent-signal text-white rounded-xl text-sm font-medium shadow-sm hover:bg-accent-signal/90 transition-colors">
                    Choose File
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-hairline bg-surface-raised flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-base transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="px-6 py-2 bg-accent-signal text-white rounded-xl text-sm font-medium shadow-sm hover:bg-accent-signal/90 disabled:opacity-50 transition-colors"
          >
            Select Image
          </button>
        </div>
      </div>
    </div>
  );
}
