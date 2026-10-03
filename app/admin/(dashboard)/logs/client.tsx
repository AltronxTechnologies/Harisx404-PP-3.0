"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, AlertCircle, Info, AlertTriangle, Bug } from "lucide-react";
import { resolveLog, clearAllResolvedLogs, testErrorLogger } from "./actions";

type LogEntry = {
  id: string;
  level: "info" | "warn" | "error" | "fatal";
  message: string;
  context: any;
  resolved: boolean;
  created_at: string;
};

export default function LogsDashboardClient({ initialLogs, loadError = "" }: { initialLogs: LogEntry[]; loadError?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

  const handleResolve = async (id: string) => {
    setWorking(true);
    setActionError("");
    try {
      const result = await resolveLog(id);
      if (!result.success) setActionError(result.error || "Unable to resolve log");
      else setLogs(current => current.map(log => log.id === id ? { ...log, resolved: true } : log));
    } catch {
      setActionError("Unable to resolve log. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleClearResolved = async () => {
    if (!window.confirm("Permanently delete all resolved logs?")) return;
    setWorking(true);
    setActionError("");
    try {
      const result = await clearAllResolvedLogs();
      if (!result.success) setActionError(result.error || "Unable to clear logs");
      else setLogs(current => current.filter(log => !log.resolved));
    } catch {
      setActionError("Unable to clear logs. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleTestError = async () => {
    setWorking(true);
    setActionError("");
    try {
      const result = await testErrorLogger();
      if (!result.success) setActionError(result.error || "Unable to create test log");
      else window.location.reload();
    } catch {
      setActionError("Unable to create test log. Try again.");
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Logs</h1>
          <p className="text-sm text-text-secondary">
            Monitor live errors, warnings, and system events.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestError}
            disabled={working || !!loadError}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border-primary bg-bg-primary px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1A1F2B]"
          >
            <AlertCircle className="h-4 w-4" />
            Simulate Error
          </button>
          <button
            onClick={handleClearResolved}
            disabled={working || !!loadError || !logs.some(log => log.resolved)}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
            Clear Resolved
          </button>
        </div>
      </div>

      {(loadError || actionError) && <div role="alert" className="rounded-xl border border-red-300/50 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">{loadError || actionError} <button type="button" onClick={() => window.location.reload()} className="ml-2 underline underline-offset-2">Retry loading</button></div>}

      <div className="rounded-xl border border-border-primary bg-surface-raised overflow-hidden shadow-sm">
        {loadError ? null : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Check className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium text-text-primary">System is healthy</h3>
            <p className="text-sm text-text-secondary mt-1">No pending logs or errors found.</p>
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
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.resolved && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Resolved</span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${log.resolved ? "line-through text-text-secondary" : "text-text-primary"}`} style={{ overflowWrap: "anywhere" }}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                    <button
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      aria-expanded={expandedLogId === log.id}
                      className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-accent-signal hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                    >
                      {expandedLogId === log.id ? "Hide Details" : "View Context"}
                    </button>
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id)}
                        disabled={working}
                        className="min-h-11 rounded-lg border border-border-primary bg-bg-primary px-3 text-xs font-medium hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current dark:hover:bg-[#1A1F2B]"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {expandedLogId === log.id && (
                  <div id={`log-context-${log.id}`} className="mt-4 overflow-x-auto rounded-lg border border-border-hairline bg-gray-50 p-4 font-mono text-xs dark:bg-[#10131A] sm:ml-9">
                    <pre className="text-text-secondary whitespace-pre-wrap">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
