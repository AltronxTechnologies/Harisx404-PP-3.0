"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";

type Post = { id: string; title: string; status: string; updated_at: string };

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

  return (
    <div className="flex items-center gap-2">
      <span role="status" className="max-w-40 text-xs text-ink-secondary">{message}</span>
      <button
        type="button"
        onClick={handleAction}
        disabled={pending}
        aria-label={`${archived ? "Restore" : "Archive"} ${post.title}`}
        className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal disabled:opacity-50"
      >
        {archived ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
