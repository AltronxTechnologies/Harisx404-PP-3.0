"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, AlertCircle, Info, AlertTriangle, Bug, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { resolveLog, resolveAllLogs, clearAllResolvedLogs, getLogsPage } from "./actions";
import { AdminConfirmDialog } from "@/app/components/admin/AdminConfirmDialog";

type LogEntry = {
  id: string;
  level: "info" | "warn" | "error" | "fatal";
  message: string;
  context: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
};

type Filters = { level: "all" | "info" | "warn" | "error" | "fatal"; status: "all" | "unresolved" | "resolved"; search: string };

export default function LogsDashboardClient({ initialLogs, totalCount: initialTotalCount, unresolvedCount, loadError = "" }: { initialLogs: LogEntry[]; totalCount: number; unresolvedCount: number; loadError?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ level: "all", status: "all", search: "" });
  const [applied, setApplied] = useState<Filters>({ level: "all", status: "all", search: "" });
  const [queryError, setQueryError] = useState("");
  const [querying, setQuerying] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmingResolveAll, setConfirmingResolveAll] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const loadPage = async (target: number, next: Filters) => {
    if (querying || loadError) return;
    setQuerying(true);
    setQueryError("");
    try {
      const result = await getLogsPage({ page: target, ...next, search: next.search.trim() });
      if (!result.success) throw new Error(result.error);
      setLogs(result.logs as LogEntry[]);
      setTotalCount(result.count);
      setPage(target);
      setApplied({ ...next, search: next.search.trim() });
      setExpandedLogId(null);
    } catch {
      setQueryError("Logs could not be loaded. The previous results are still shown; try again.");
    } finally {
      setQuerying(false);
    }
  };

  const handleResolve = async (id: string) => {
    setWorking(true);
    setActionError("");
    try {
      const result = await resolveLog(id);
      if (!result.success) setActionError(result.error || "Unable to resolve log");
      else window.location.reload();
    } catch {
      setActionError("Unable to resolve log. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleClearResolved = async (typed: string) => {
    if (typed !== "DELETE" || working || !confirmingClear) return;
    setWorking(true);
    setActionError("");
    try {
      const result = await clearAllResolvedLogs();
      if (!result.success) {
        setConfirmingClear(false);
        setActionError(result.error || "Unable to clear logs");
      }
      else {
        window.location.reload();
      }
    } catch {
      setConfirmingClear(false);
      setActionError("Unable to clear logs. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleResolveAll = async (typed: string) => {
    if (typed !== "RESOLVE ALL" || working || !confirmingResolveAll) return;
    setWorking(true);
    setActionError("");
    try {
      const result = await resolveAllLogs();
      if (!result.success) {
        setConfirmingResolveAll(false);
        setActionError(result.error || "Unable to resolve all logs");
      } else window.location.reload();
    } catch {
      setConfirmingResolveAll(false);
      setActionError("Unable to resolve all logs. Refresh and try again.");
    } finally {
      setWorking(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info": return <Info className="h-5 w-5 text-blue-500" />;
      case "warn": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error": return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "fatal": return <Bug className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "info": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "warn": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "error": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case "fatal": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">System Logs</h1>
          <p className="text-sm text-text-secondary">
            Investigate events recorded by the application. Server, infrastructure and third-party failures are not automatically collected here.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap xl:justify-end">
          <button type="button" onClick={() => window.location.reload()} disabled={working || querying} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-hairline bg-surface-raised px-4 text-sm font-medium text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 sm:w-auto"><RefreshCw aria-hidden className="size-4" />Refresh</button>
          <button type="button" onClick={() => setConfirmingResolveAll(true)} disabled={working || querying || !!loadError || unresolvedCount === 0} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-hairline bg-surface-raised px-4 text-sm font-medium text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 sm:w-auto"><Check aria-hidden className="size-4" />Mark all as resolved</button>
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={working || querying || !!loadError || initialTotalCount <= unresolvedCount}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 sm:w-auto dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 aria-hidden className="size-4" />
            Clear all resolved
          </button>
        </div>
      </div>

       {loadError && <div role="alert" className="rounded-xl border border-red-300/50 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">{loadError} <button type="button" onClick={() => window.location.reload()} className="ml-2 inline-flex min-h-11 items-center underline underline-offset-2">Reload logs</button></div>}
       {actionError && <div role="alert" className="rounded-xl border border-red-300/50 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">{actionError} The action was not confirmed; refresh status before retrying. <button type="button" onClick={() => window.location.reload()} className="ml-2 inline-flex min-h-11 items-center underline underline-offset-2">Refresh status</button></div>}
        {!loadError && <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-hairline bg-surface-raised p-5"><p className="text-sm text-ink-secondary">Recorded events</p><p className="mt-2 text-3xl font-semibold text-ink-primary">{initialTotalCount.toLocaleString()}</p></div>
          <div className="rounded-2xl border border-border-hairline bg-surface-raised p-5"><p className="text-sm text-ink-secondary">Unresolved events</p><p className="mt-2 text-3xl font-semibold text-ink-primary">{unresolvedCount.toLocaleString()}</p></div>
        </div>}

        {!loadError && <form onSubmit={(event) => { event.preventDefault(); void loadPage(1, filters); }} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border-hairline bg-surface-raised p-4">
          <label className="min-w-[160px] flex-1 text-xs font-medium text-ink-secondary">Severity<select value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value as Filters["level"] })} style={{ colorScheme: "dark" }} className="mt-2 min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><option value="all">All levels</option><option value="fatal">Fatal</option><option value="error">Error</option><option value="warn">Warning</option><option value="info">Info</option></select></label>
          <label className="min-w-[160px] flex-1 text-xs font-medium text-ink-secondary">Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as Filters["status"] })} style={{ colorScheme: "dark" }} className="mt-2 min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><option value="all">All statuses</option><option value="unresolved">Unresolved</option><option value="resolved">Resolved</option></select></label>
          <label className="min-w-[200px] flex-[2] text-xs font-medium text-ink-secondary">Search message<input type="search" maxLength={120} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Find an event" className="mt-2 min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm text-ink-primary placeholder:text-ink-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current" /></label>
          <button type="submit" disabled={querying || working} className="min-h-11 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50">Apply filters</button>
        </form>}
        {!loadError && <p role="status" className="text-sm text-ink-secondary">{querying ? "Loading events..." : `Showing ${totalCount ? (page - 1) * 50 + 1 : 0}-${Math.min(page * 50, totalCount)} of ${totalCount.toLocaleString()} matching events`}{applied.level !== "all" || applied.status !== "all" || applied.search ? " (filtered)" : ""}. Counts reflect the last refresh.</p>}
        {queryError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">{queryError}</p>}

      <div className="rounded-xl border border-border-primary bg-surface-raised overflow-hidden shadow-sm">
        {loadError ? null : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Check className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No matching events</h3>
              <p className="text-sm text-text-secondary mt-1">Try different filters, or refresh to check for new events. An empty list does not prove the site is healthy.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-hairline">
            {logs.map((log) => (
              <div key={log.id} className={`flex flex-col p-4 transition-colors ${log.resolved ? "opacity-60 bg-gray-50 dark:bg-[#10131A]/50" : "hover:bg-gray-50 dark:hover:bg-[#1A1F2B]"}`}>
                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-1 shrink-0">{getLevelIcon(log.level)}</div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLevelBadgeClass(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {Number.isNaN(new Date(log.created_at).getTime()) ? "Time unavailable" : formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.resolved && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Resolved</span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${log.resolved ? "text-text-secondary" : "text-text-primary"}`} style={{ overflowWrap: "anywhere" }}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                    <button
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                       aria-expanded={expandedLogId === log.id}
                       aria-controls={`log-context-${log.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-accent-signal hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                    >
                        {expandedLogId === log.id ? "Hide details" : "View details"}
                    </button>
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id)}
                         disabled={working || querying}
                        className="min-h-11 rounded-lg border border-border-primary bg-bg-primary px-3 text-xs font-medium hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current dark:hover:bg-[#1A1F2B]"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {expandedLogId === log.id && (
                  <div id={`log-context-${log.id}`} className="mt-4 overflow-x-auto rounded-lg border border-border-hairline bg-gray-50 p-4 font-mono text-xs dark:bg-[#10131A] sm:ml-9">
                    <p className="mb-3 text-sm font-medium text-ink-primary">Recorded details</p>
                    <p className="mb-3 text-xs text-ink-secondary">{log.context && typeof log.context.message === "string" ? `Reported reason: ${log.context.message}` : "No specific cause was recorded. Check the event context and server or provider logs for more evidence."}</p>
                    <p className="mb-3 text-xs text-ink-secondary">Recorded {Number.isNaN(new Date(log.created_at).getTime()) ? "at an unknown time" : new Date(log.created_at).toLocaleString()}.</p>
                    <pre className="whitespace-pre-wrap break-all text-text-secondary">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {!loadError && totalCount > 50 && <nav aria-label="Log pages" className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-secondary"><button type="button" disabled={page <= 1 || querying || working} onClick={() => void loadPage(page - 1, applied)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 text-ink-primary disabled:opacity-50"><ChevronLeft aria-hidden className="size-4" />Previous</button><span>Page {page} of {Math.ceil(totalCount / 50)}</span><button type="button" disabled={page >= Math.ceil(totalCount / 50) || querying || working} onClick={() => void loadPage(page + 1, applied)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 text-ink-primary disabled:opacity-50">Next<ChevronRight aria-hidden className="size-4" /></button></nav>}
      <AdminConfirmDialog open={confirmingResolveAll} title="Mark all logs as resolved?" description={`This will mark all ${unresolvedCount.toLocaleString()} unresolved events as resolved, including those outside this page or hidden by filters. It does not fix the underlying issues or delete any logs. New events may still arrive.`} confirmLabel="Mark all as resolved" confirmText="RESOLVE ALL" pending={working} onClose={() => setConfirmingResolveAll(false)} onConfirm={(typed) => void handleResolveAll(typed)} />
      <AdminConfirmDialog open={confirmingClear} title="Permanently clear resolved logs?" description="All resolved log records will be deleted, including those outside this page or hidden by filters. This cannot be undone. Unresolved logs will be kept." confirmLabel="Clear all resolved" confirmText="DELETE" destructive pending={working} onClose={() => setConfirmingClear(false)} onConfirm={(typed) => void handleClearResolved(typed)} />
    </div>
  );
}
