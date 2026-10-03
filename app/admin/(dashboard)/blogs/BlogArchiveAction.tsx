"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

type Post = { id: string; slug: string; title: string; status: string; updated_at: string };

export function BlogArchiveAction({ post }: { post: Post }) {
  const router = useRouter();
  const [current, setCurrent] = useState({ status: post.status, updated_at: post.updated_at });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const archived = current.status === "archived";
  const action = archived ? "restore" : "archive";

  useEffect(() => {
    setCurrent({ status: post.status, updated_at: post.updated_at });
  }, [post.status, post.updated_at]);

  async function handleAction() {
    if (!archived && !window.confirm(`Archive and unpublish "${post.title}"? It will no longer be public. The post is retained and can be restored as a draft.`)) return;
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
      setMessage(action === "archive" ? "Post archived and unpublished." : "Post restored as a draft.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not ${action} post`);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    const confirmation = window.prompt(`Permanently delete "${post.title}"? This cannot be undone. Type the exact slug to confirm: ${post.slug}`);
    if (confirmation === null) return;
    if (confirmation !== post.slug) {
      setMessage("Deletion cancelled. The slug did not match.");
      return;
    }
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
      setMessage("Post permanently deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not permanently delete post");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span role="status" className="max-w-40 text-xs text-ink-secondary">{message}</span>
      <button
        type="button"
        onClick={handleAction}
        disabled={pending}
        aria-label={`${archived ? "Restore" : "Archive"} ${post.title}`}
        className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"
      >
        {archived ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
      </button>
      {archived && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Permanently delete ${post.title}`}
          className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
