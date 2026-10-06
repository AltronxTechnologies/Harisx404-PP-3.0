"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Check, Copy, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { blogImageUrls } from "@/app/lib/admin/blog-image-urls";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

export type BlogMediaItem = { id: string; url: string; secure_url: string; alt_text?: string };

export function BlogImageManager({ postId, images, onImagesChange, onAvailabilityChange, coverUrl, content, onCoverChange }: {
  postId?: string;
  images: BlogMediaItem[];
  onImagesChange: (images: BlogMediaItem[], dirty?: boolean) => void;
  onAvailabilityChange: (available: boolean) => void;
  coverUrl: string;
  content: string;
  onCoverChange: (image?: BlogMediaItem) => void;
}) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<BlogMediaItem | null>(null);
  const [pending, setPending] = useState(false);
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const embeddedUrls = useMemo(() => blogImageUrls(content), [content]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAvailable(false);
    setAttachedIds([]);
    setPicker(false);
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
    if (images.some((item) => item.id === image.id)) return true;
    if (images.length >= 20) { setMessage("Choose no more than 20 images for one post."); return false; }
    onImagesChange([...images, image]);
    setMessage("");
    return true;
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length || uploading) return;
    if (images.length + files.length > 20) { setMessage(`Choose at most ${20 - images.length} more images.`); return; }
    if (files.some((file) => ((file.type !== "" && !file.type.startsWith("image/")) || (file.type === "" && !/\.(?:jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|ico)$/i.test(file.name)) || file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name) || !file.name || file.name.length > 255 || !file.size || file.size > 20 * 1024 * 1024))) {
      setMessage("Choose nonempty images under 20 MB with filenames under 256 characters. SVG is not supported.");
      return;
    }
    setUploading(true);
    setMessage("");
    const next = [...images];
    let warning = "";
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        if (postId) body.append("blog_post_id", postId);
        const response = await fetch("/api/admin/media/upload", { method: "POST", body });
        const result = await readAdminResponse(response, "Blog image upload");
        if (!response.ok || !result.data?.id) throw new Error(result.error || "Upload could not be confirmed. Check the Media Library before retrying.");
        next.push(result.data as BlogMediaItem);
        if (result.warning) warning = result.warning;
      }
      setMessage(warning || `${files.length} ${files.length === 1 ? "image" : "images"} uploaded. Save the post to attach them; the files are already in the Media Library.`);
    } catch (error) {
      setMessage(`${next.length - images.length} of ${files.length} images uploaded. ${error instanceof Error ? error.message : "Check the Media Library before retrying."} Uploaded files remain in the library until removed.`);
    } finally {
      if (next.length !== images.length) onImagesChange(next);
      setUploading(false);
    }
  };

  const copyLink = async (image: BlogMediaItem) => {
    try {
      await navigator.clipboard.writeText(image.secure_url || image.url);
      setMessage("Image link copied to clipboard.");
    } catch {
      setMessage("Could not copy the image link. Check clipboard permissions and try again.");
    }
  };

  const deleteImage = async (typed: string) => {
    if (!deleting || pending || typed !== "DELETE") return;
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
      setDeleting(null);
      setMessage(error instanceof Error ? error.message : "Image could not be deleted.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section aria-labelledby="blog-images-heading" className="min-w-0 space-y-4 rounded-xl border border-border-hairline bg-surface-base p-4 sm:p-5">
      <div>
        <h2 id="blog-images-heading" className="text-base font-semibold">Post images</h2>
        <p className="mt-1 text-sm text-ink-secondary">Upload up to 20 images, choose one as the cover shown on Blog cards, or copy a link into your MDX. Uploads enter the Media Library immediately; save the post to attach them. Remove permanently deletes an unused file from Cloudinary and the library after confirmation. Referenced images cannot be deleted.</p>
      </div>
      {message && <p role="status" className="rounded-lg border border-border-hairline p-3 text-sm text-ink-secondary">{message}</p>}
      {loading && <p role="status" className="text-sm text-ink-secondary">Loading post images...</p>}
      {!loading && !available && <p className="text-sm text-ink-secondary">Image management is unavailable. Existing post images will not be changed when you save.</p>}
      {available && <>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current ${uploading || pending || images.length >= 20 ? "opacity-50" : "cursor-pointer hover:bg-surface-raised"}`}><UploadCloud className="size-4" aria-hidden />{uploading ? "Uploading images..." : "Upload images"}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/tiff,image/bmp,image/x-icon" disabled={uploading || pending || images.length >= 20} onChange={(event) => void uploadImages(event)} className="sr-only" /></label>
          <button type="button" disabled={images.length >= 20 || uploading || pending} onClick={() => setPicker(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium hover:bg-surface-raised disabled:opacity-50"><ImagePlus className="size-4" aria-hidden />Add from library</button>
          <span className="text-xs text-ink-secondary">{images.length} / 20 attached</span>
        </div>
        {!images.length && <p className="rounded-lg border border-dashed border-border-hairline p-4 text-sm text-ink-secondary">No managed images selected. Images already embedded in MDX stay in the article; recognized library images are linked when you save.</p>}
        <div role="region" aria-label="Post image thumbnails" className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image, index) => {
            const url = image.secure_url || image.url;
            const isCover = coverUrl === image.url || coverUrl === image.secure_url;
            const inArticle = [image.url, image.secure_url].some((source) => Boolean(source) && (embeddedUrls.includes(source) || content.includes(source)));
            return <div key={image.id} className={`min-w-0 overflow-hidden rounded-xl border bg-surface-raised ${isCover ? "border-accent-signal" : "border-border-hairline"}`}>
              <div className="relative aspect-[4/3] bg-surface-base"><Image src={url} alt={image.alt_text || "Post image"} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain" /></div>
              <div className="space-y-3 p-3">
                <p className="truncate text-xs text-ink-secondary" title={image.alt_text || "Image"}>{image.alt_text || "Image"}</p>
                <button type="button" disabled={pending || uploading} aria-pressed={isCover} onClick={() => onCoverChange(image)} className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-border-hairline px-3 text-left text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50">
                  <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${isCover ? "border-accent-signal bg-accent-signal text-white" : "border-border-hairline"}`}>{isCover && <Check className="size-3" />}</span>
                  {isCover ? "Thumbnail cover selected" : "Make cover"}
                </button>
                <p className="text-xs text-ink-secondary">{inArticle ? "In article" : "Available for this post"}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button type="button" onClick={() => void copyLink(image)} className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-border-hairline px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Copy className="size-4 shrink-0" aria-hidden />Copy link</button>
                  <button type="button" disabled={pending || uploading} onClick={() => { if (isCover || inArticle) { setMessage("Choose another cover or remove this image from MDX / Code and save the post before deleting the file."); return; } setDeleting(image); }} className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-red-500/40 px-1 text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"><Trash2 className="size-4 shrink-0" aria-hidden />Remove</button>
                </div>
                <span className="sr-only">Image {index + 1}</span>
              </div>
            </div>;
          })}
        </div>
        {embeddedUrls.length > 0 && <p className="text-xs text-ink-secondary">{embeddedUrls.length} image {embeddedUrls.length === 1 ? "URL" : "URLs"} found in the article. Change those references in MDX / Code before deleting a file; external images are not managed here.</p>}
      </>}
      <MediaPickerModal isOpen={picker} libraryOnly blogPostId={postId} onClose={() => setPicker(false)} onSelect={(media) => addImage(media as BlogMediaItem)} />
      <AdminConfirmDialog open={deleting !== null} title="Permanently remove image?" description="This removes the file from Cloudinary and the shared media library, not just this post. Known references block deletion. This cannot be undone." confirmLabel="Remove permanently" confirmText="DELETE" cancelLabel="Keep image" pending={pending} destructive onClose={() => setDeleting(null)} onConfirm={(typed) => void deleteImage(typed)} />
    </section>
  );
}
