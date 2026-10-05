"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/app/components/admin/AdminConfirmDialog";

type Post = { id: string; slug: string; title: string; status: string; updated_at: string };

export function BlogArchiveAction({ post }: { post: Post }) {
  const router = useRouter();
  const [current, setCurrent] = useState({ status: post.status, updated_at: post.updated_at });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [dialog, setDialog] = useState<"archive" | "delete" | null>(null);
  const archived = current.status === "archived";
  const action = archived ? "restore" : "archive";

  useEffect(() => {
    setCurrent({ status: post.status, updated_at: post.updated_at });
  }, [post.status, post.updated_at]);

  function showNotice(notice: "archived" | "restored" | "deleted") {
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    url.searchParams.delete("cleanup");
    url.searchParams.set("notice", notice);
    router.replace(`${url.pathname}${url.search}`);
    router.refresh();
  }

  async function handleAction() {
    if (pending) return;
    setDialog(null);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/blogs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, updated_at: current.updated_at, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Could not ${action} post`);
      setCurrent({ status: result.status, updated_at: result.updated_at });
      showNotice(action === "archive" ? "archived" : "restored");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not ${action} post`);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(confirmation: string) {
    if (pending) return;
    if (confirmation !== post.slug) {
      setMessage("Deletion cancelled. The slug did not match.");
      return;
    }
    setDialog(null);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/blogs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, updated_at: current.updated_at, confirm_slug: confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not permanently delete post");
      if (result.cleanup_warning) {
        const url = new URL(window.location.href);
        url.searchParams.delete("saved");
        url.searchParams.set("notice", "deleted");
        url.searchParams.set("cleanup", "images");
        router.replace(`${url.pathname}${url.search}`);
        router.refresh();
        return;
      }
      showNotice("deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not permanently delete post");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span role="alert" className="max-w-40 break-words text-xs text-red-300" title={message}>{message}</span>}
      <button
        type="button"
        onClick={() => archived ? void handleAction() : setDialog("archive")}
        disabled={pending}
        aria-label={`${archived ? "Restore" : "Archive"} ${post.title}`}
        className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"
      >
        {archived ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
      </button>
      {archived && (
        <button
          type="button"
          onClick={() => setDialog("delete")}
          disabled={pending}
          aria-label={`Permanently delete ${post.title}`}
          className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      <AdminConfirmDialog
        open={dialog !== null}
        title={dialog === "delete" ? "Permanently delete post?" : "Archive this post?"}
        description={dialog === "delete" ? `“${post.title}” will be removed permanently. This cannot be undone.` : `“${post.title}” will be unpublished and kept as an archived draft that you can restore.`}
        confirmLabel={dialog === "delete" ? "Delete permanently" : "Archive post"}
        confirmText={dialog === "delete" ? post.slug : undefined}
        destructive={dialog === "delete"}
        pending={pending}
        onClose={() => setDialog(null)}
        onConfirm={(confirmation) => dialog === "delete" ? void handleDelete(confirmation) : void handleAction()}
      />
    </div>
  );
}
