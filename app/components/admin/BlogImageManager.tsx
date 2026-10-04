"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { blogImageUrls } from "@/app/lib/admin/blog-image-urls";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";

export type BlogMediaItem = { id: string; url: string; secure_url: string; alt_text?: string };

export function BlogImageManager({ postId, images, onImagesChange, onAvailabilityChange, coverUrl, content, onCoverChange, onAppendImage, onEditSource }: {
  postId?: string;
  images: BlogMediaItem[];
  onImagesChange: (images: BlogMediaItem[], dirty?: boolean) => void;
  onAvailabilityChange: (available: boolean) => void;
  coverUrl: string;
  content: string;
  onCoverChange: (image?: BlogMediaItem | { url: string }) => void;
  onAppendImage: (image: BlogMediaItem) => void;
  onEditSource: () => void;
}) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<"add" | "replace" | "cover" | null>(null);
  const [pickerTab, setPickerTab] = useState<"library" | "upload">("library");
  const [replaceId, setReplaceId] = useState("");
  const [deleting, setDeleting] = useState<BlogMediaItem | null>(null);
  const [pending, setPending] = useState(false);
  const [altDraft, setAltDraft] = useState<Record<string, string>>({});
  const embeddedUrls = useMemo(() => blogImageUrls(content), [content]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/blogs/images${postId ? `?postId=${encodeURIComponent(postId)}` : ""}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 503 ? "Blog image collection requires the reviewed database migration." : "Blog images could not be loaded. Try reloading this page.");
        return response.json();
      })
      .then(({ data }) => {
        if (cancelled) return;
        onImagesChange(data || [], false);
        setAvailable(true);
        onAvailabilityChange(true);
      })
      .catch((error) => { if (!cancelled) setMessage(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // The initial request must not reset images after a form edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const addImage = (image: BlogMediaItem) => {
    if (images.some((item) => item.id === image.id)) return;
    if (images.length >= 40) { setMessage("Choose no more than 40 images for one post."); return; }
    onImagesChange([...images, image]);
    setMessage("");
  };

  const deleteImage = async () => {
    if (!deleting || pending) return;
    setPending(true);
    setMessage("");
    const image = deleting;
    try {
      const params = new URLSearchParams({ id: image.id });
      if (postId) params.set("detach_blog_post_id", postId);
      const response = await fetch(`/api/admin/media?${params}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Image could not be deleted.");
      }
      onImagesChange(images.filter((item) => item.id !== image.id));
      setDeleting(null);
      setMessage("Image removed from Cloudinary and the media library.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image could not be deleted.");
    } finally {
      setPending(false);
    }
  };

  const saveDescription = async (image: BlogMediaItem) => {
    const description = (altDraft[image.id] ?? image.alt_text ?? "").trim();
    if (!description || description.length > 160) { setMessage("Image description must contain 1 to 160 characters."); return; }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: image.id, alt_text: description }) });
      if (!response.ok) throw new Error("Could not update the image description.");
      onImagesChange(images.map((item) => item.id === image.id ? { ...item, alt_text: description } : item), false);
      setMessage("Shared library description updated. Article image descriptions are edited in MDX / Code.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the image description.");
    } finally { setPending(false); }
  };

  return (
    <section aria-labelledby="blog-images-heading" className="min-w-0 space-y-4 rounded-xl border border-border-hairline bg-surface-base p-4 sm:p-5">
      <div>
        <h2 id="blog-images-heading" className="text-base font-semibold">Post images</h2>
        <p className="mt-1 text-sm text-ink-secondary">Manage Cloudinary images for this post. Set one as the thumbnail cover or append it to the article. Uploading adds the file to the shared media library immediately; post changes take effect on Save. A file detached on Save can then be permanently removed from the <Link href="/admin/media" className="text-ink-primary underline underline-offset-2">Media Library</Link>.</p>
      </div>
      {message && <p role="status" className="rounded-lg border border-border-hairline p-3 text-sm text-ink-secondary">{message}</p>}
      {loading && <p role="status" className="text-sm text-ink-secondary">Loading post images...</p>}
      {available && <>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setPicker("add"); setPickerTab("upload"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium"><UploadCloud className="size-4" aria-hidden />Upload image</button>
          <button type="button" onClick={() => { setPicker("add"); setPickerTab("library"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium"><ImagePlus className="size-4" aria-hidden />Add from library</button>
        </div>
        {!images.length && <p className="rounded-lg border border-dashed border-border-hairline p-4 text-sm text-ink-secondary">No managed images attached yet. Images already embedded in MDX remain in the article; recognized library images will be linked when you save.</p>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => {
            const url = image.secure_url || image.url;
            const isCover = url === coverUrl;
            const inArticle = embeddedUrls.includes(url);
            return <div key={image.id} className="min-w-0 overflow-hidden rounded-xl border border-border-hairline bg-surface-raised">
              <div className="relative h-36 bg-surface-base"><Image src={url} alt={image.alt_text || "Post image"} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-contain" /></div>
              <div className="space-y-3 p-3">
                <p className="truncate text-xs text-ink-secondary" title={image.alt_text || "Image"}>{image.alt_text || "Image"}</p>
                <p className="text-xs text-ink-secondary">{[isCover && "Thumbnail cover", inArticle && "In article", !isCover && !inArticle && "Available for this post"].filter(Boolean).join(" / ")}</p>
                <div>
                  <label htmlFor={`blog-image-alt-${image.id}`} className="text-xs text-ink-secondary">Library description (shared)</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <input id={`blog-image-alt-${image.id}`} value={altDraft[image.id] ?? image.alt_text ?? ""} maxLength={160} onChange={(event) => setAltDraft((draft) => ({ ...draft, [image.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-border-hairline bg-surface-base px-2 text-sm" />
                    <button type="button" disabled={pending || (altDraft[image.id] ?? image.alt_text ?? "") === (image.alt_text ?? "")} onClick={() => void saveDescription(image)} className="min-h-11 rounded-lg border border-border-hairline px-3 text-xs disabled:opacity-50">Save description</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {!isCover && <button type="button" onClick={() => onCoverChange(image)} className="min-h-11 rounded-lg border border-border-hairline px-3">Make cover</button>}
                  <button type="button" onClick={() => onAppendImage(image)} className="min-h-11 rounded-lg border border-border-hairline px-3">Append to article</button>
                  <button type="button" onClick={() => { setReplaceId(image.id); setPicker("replace"); setPickerTab("library"); }} className="min-h-11 rounded-lg border border-border-hairline px-3">Replace</button>
                  <button type="button" onClick={() => {
                    if (isCover || inArticle) { setMessage("Change the cover or remove this image from the article first, then remove it from this post."); return; }
                    onImagesChange(images.filter((item) => item.id !== image.id));
                  }} className="min-h-11 rounded-lg border border-border-hairline px-3">Remove</button>
                  <button type="button" onClick={() => { if (isCover || inArticle) { setMessage("Remove this image from the cover and article, save the post, then delete the detached file from Media Library."); return; } setDeleting(image); }} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-red-500/40 px-3 text-red-300"><Trash2 className="size-3" aria-hidden />Delete file</button>
                </div>
                <span className="sr-only">Image {index + 1}</span>
              </div>
            </div>;
          })}
        </div>
        {coverUrl && <button type="button" onClick={() => onCoverChange()} className="min-h-11 text-sm text-ink-secondary underline underline-offset-2">Clear thumbnail cover</button>}
        {embeddedUrls.length > 0 && <div className="rounded-lg border border-border-hairline p-3 text-sm text-ink-secondary">
          <p>{embeddedUrls.length} image {embeddedUrls.length === 1 ? "URL" : "URLs"} in the article. Library images used in MDX join this collection when saved; external images stay in the article but cannot be deleted from Cloudinary here.</p>
          <button type="button" onClick={onEditSource} className="mt-2 min-h-11 text-ink-primary underline underline-offset-2">Edit article images in MDX / Code</button>
          <div className="mt-2 flex flex-wrap gap-2">
            {embeddedUrls.filter((url) => !images.some((image) => url === image.secure_url || url === image.url) && (url.startsWith("/blog/") || isAllowedBlogImageUrl(url))).map((url, index) => <button key={url} type="button" onClick={() => onCoverChange({ url })} className="min-h-11 rounded-lg border border-border-hairline px-3 text-xs">Use article image {index + 1} as cover</button>)}
          </div>
        </div>}
      </>}
      <MediaPickerModal isOpen={picker !== null} initialTab={pickerTab} onClose={() => setPicker(null)} onSelect={(media) => {
        const image = media as BlogMediaItem;
        if (picker === "replace") {
          const old = images.find((item) => item.id === replaceId);
          if (old && (old.secure_url === coverUrl || old.url === coverUrl)) onCoverChange(image);
          if (old && embeddedUrls.some((url) => url === old.url || url === old.secure_url)) setMessage("The old image is still in the article. Update its MDX reference before removing or deleting it.");
          onImagesChange(images.map((item) => item.id === replaceId ? image : item).filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index));
        } else addImage(image);
      }} />
      <AdminConfirmDialog open={deleting !== null} title="Delete this Cloudinary image?" description="This permanently removes the file from Cloudinary and the shared media library. Deletion is blocked if another Blog, Project, cover or article still uses it. This cannot be undone." confirmLabel="Delete file permanently" cancelLabel="Keep image" pending={pending} destructive onClose={() => setDeleting(null)} onConfirm={() => void deleteImage()} />
    </section>
  );
}
