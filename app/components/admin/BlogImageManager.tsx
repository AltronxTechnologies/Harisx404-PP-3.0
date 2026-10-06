"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { blogImageUrls } from "@/app/lib/admin/blog-image-urls";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

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
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const embeddedUrls = useMemo(() => blogImageUrls(content), [content]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAvailable(false);
    setAttachedIds([]);
    setPicker(null);
    setMessage("");
    onAvailabilityChange(false);
    fetch(`/api/admin/blogs/images${postId ? `?postId=${encodeURIComponent(postId)}` : ""}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 503 ? "Blog image collection requires the reviewed database migration." : "Blog images could not be loaded. Try reloading this page.");
        return response.json();
      })
      .then(({ data }) => {
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error("Blog images could not be loaded. Try reloading this page.");
        onImagesChange(data, false);
        setAttachedIds(data.map((image: BlogMediaItem) => image.id));
        setAvailable(true);
        onAvailabilityChange(true);
      })
      .catch((error) => { if (!cancelled) { setAvailable(false); setMessage(error instanceof Error ? error.message : "Blog images could not be loaded."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // The initial request must not reset images after a form edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const addImage = (image: BlogMediaItem) => {
    if (images.some((item) => item.id === image.id)) return;
    if (images.length >= 20) { setMessage("Choose no more than 20 images for one post."); return; }
    onImagesChange([...images, image]);
    setMessage("");
  };

  const copyLink = async (image: BlogMediaItem) => {
    try {
      await navigator.clipboard.writeText(image.secure_url || image.url);
      setMessage("Image link copied to clipboard.");
    } catch {
      setMessage("Could not copy the image link. Check clipboard permissions and try again.");
    }
  };

  const deleteImage = async () => {
    if (!deleting || pending) return;
    setPending(true);
    setMessage("");
    const image = deleting;
    try {
      const params = new URLSearchParams({ id: image.id });
      if (postId && attachedIds.includes(image.id)) params.set("detach_blog_post_id", postId);
      const response = await fetch(`/api/admin/media?${params}`, { method: "DELETE" });
      const result = await readAdminResponse(response, "Blog image deletion");
      if (!response.ok) {
        throw new Error(result.error || "Image could not be deleted.");
      }
      if (result.success !== true) throw new Error("Image deletion could not be confirmed. Refresh the library before retrying.");
      onImagesChange(images.filter((item) => item.id !== image.id));
      setAttachedIds((ids) => ids.filter((id) => id !== image.id));
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
        <p className="mt-1 text-sm text-ink-secondary">Manage up to 20 Cloudinary images for this post. Choose a thumbnail cover or append an image to the article. Uploads enter the shared library immediately; attachment changes take effect on Save. Remove only detaches from this post; Delete file permanently removes the file from Cloudinary and the library after confirmation, if it is not in use elsewhere. Detached files can also be deleted from the <Link href="/admin/media" className="text-ink-primary underline underline-offset-2">Media Library</Link>.</p>
      </div>
      {message && <p role="status" className="rounded-lg border border-border-hairline p-3 text-sm text-ink-secondary">{message}</p>}
      {loading && <p role="status" className="text-sm text-ink-secondary">Loading post images...</p>}
      {!loading && !available && <p className="text-sm text-ink-secondary">Image management is unavailable. Existing post images will not be changed when you save.</p>}
      {available && <>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={images.length >= 20} onClick={() => { setPicker("add"); setPickerTab("upload"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium disabled:opacity-50"><UploadCloud className="size-4" aria-hidden />Upload image</button>
          <button type="button" disabled={images.length >= 20} onClick={() => { setPicker("add"); setPickerTab("library"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium disabled:opacity-50"><ImagePlus className="size-4" aria-hidden />Add from library</button>
          <span className="text-xs text-ink-secondary">{images.length} / 20 attached</span>
        </div>
        {!images.length && <p className="rounded-lg border border-dashed border-border-hairline p-4 text-sm text-ink-secondary">No managed images attached yet. Images already embedded in MDX remain in the article; recognized library images will be linked when you save.</p>}
        <div role="region" aria-label="Post image thumbnails" tabIndex={0} className="flex min-w-0 snap-x gap-3 overflow-x-auto pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
          {images.map((image, index) => {
            const url = image.secure_url || image.url;
            const isCover = coverUrl === image.url || coverUrl === image.secure_url;
            const inArticle = [image.url, image.secure_url].some((source) => Boolean(source) && (embeddedUrls.includes(source) || content.includes(source)));
            return <div key={image.id} className={`w-60 shrink-0 snap-start overflow-hidden rounded-xl border bg-surface-raised ${isCover ? "border-accent-signal" : "border-border-hairline"}`}>
              <div className="relative h-36 bg-surface-base"><Image src={url} alt={image.alt_text || "Post image"} fill sizes="240px" className="object-contain" /></div>
              <div className="space-y-3 p-3">
                <p className="truncate text-xs text-ink-secondary" title={image.alt_text || "Image"}>{image.alt_text || "Image"}</p>
                <button type="button" aria-pressed={isCover} onClick={() => onCoverChange(image)} className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-border-hairline px-3 text-left text-xs font-medium">
                  <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${isCover ? "border-accent-signal bg-accent-signal text-white" : "border-border-hairline"}`}>{isCover && <Check className="size-3" />}</span>
                  {isCover ? "Thumbnail cover selected" : "Make cover"}
                </button>
                <p className="text-xs text-ink-secondary">{inArticle ? "In article" : "Available for this post"}</p>
                <div>
                  <label htmlFor={`blog-image-alt-${image.id}`} className="text-xs text-ink-secondary">Library description (shared)</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <input id={`blog-image-alt-${image.id}`} value={altDraft[image.id] ?? image.alt_text ?? ""} maxLength={160} onChange={(event) => setAltDraft((draft) => ({ ...draft, [image.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-border-hairline bg-surface-base px-2 text-sm" />
                    <button type="button" disabled={pending || (altDraft[image.id] ?? image.alt_text ?? "") === (image.alt_text ?? "")} onClick={() => void saveDescription(image)} className="min-h-11 rounded-lg border border-border-hairline px-3 text-xs disabled:opacity-50">Save description</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={() => void copyLink(image)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border-hairline px-3"><Copy className="size-3" aria-hidden />Copy link</button>
                  <button type="button" onClick={() => onAppendImage(image)} className="min-h-11 rounded-lg border border-border-hairline px-3">Append to article</button>
                  <button type="button" onClick={() => { if (inArticle) { setMessage("Update the old image reference in MDX / Code before replacing it."); return; } setReplaceId(image.id); setPicker("replace"); setPickerTab("library"); }} className="min-h-11 rounded-lg border border-border-hairline px-3">Replace</button>
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
      <MediaPickerModal isOpen={picker !== null} initialTab={pickerTab} blogPostId={postId} onClose={() => setPicker(null)} onSelect={(media) => {
        const image = media as BlogMediaItem;
        if (picker === "replace") {
          const old = images.find((item) => item.id === replaceId);
          if (!old) { setMessage("Image to replace is no longer attached. Try again."); return; }
          if ([old.url, old.secure_url].some((source) => Boolean(source) && (embeddedUrls.includes(source) || content.includes(source)))) { setMessage("Update the old image reference in MDX / Code before replacing it."); return; }
          if (old.secure_url === coverUrl || old.url === coverUrl) onCoverChange(image);
          onImagesChange(images.map((item) => item.id === replaceId ? image : item).filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index));
        } else addImage(image);
      }} />
      <AdminConfirmDialog open={deleting !== null} title="Delete this Cloudinary image?" description="This permanently removes the file from Cloudinary and the shared media library. Deletion is blocked if another Blog, Project, cover or article still uses it. This cannot be undone." confirmLabel="Delete file permanently" cancelLabel="Keep image" pending={pending} destructive onClose={() => setDeleting(null)} onConfirm={() => void deleteImage()} />
    </section>
  );
}
