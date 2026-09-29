"use client";

import React, { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { highlight } from "sugar-high";

export function BlogInlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code style={{
      borderRadius: "4px",
      background: "color-mix(in srgb, var(--text-primary) 7%, var(--bg-primary))",
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: "0.86em",
      padding: "0.12em 0.32em",
      overflowWrap: "anywhere",
    }}>{children}</code>
  );
}

export function BlogCodeWindow({ children }: { children?: React.ReactNode }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const codeElement = React.Children.toArray(children).find(React.isValidElement) as React.ReactElement<{ children?: React.ReactNode; className?: string }> | undefined;
  if (!codeElement) return <pre>{children}</pre>;

  const raw = codeElement.props.children;
  const code = typeof raw === "string" ? raw : React.Children.toArray(raw).join("");
  const match = /^language-([^:\s]+)(?::([^\s]+))?/.exec(codeElement.props.className || "");
  const language = match?.[1] || "";
  const filename = match?.[2] || "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="not-prose" style={{
      width: "100%",
      minWidth: 0,
      margin: "2rem 0 2.25rem",
      overflow: "hidden",
      border: "1px solid var(--border-primary)",
      borderRadius: "16px",
      padding: "4px",
      background: "color-mix(in srgb, var(--text-primary) 5%, var(--bg-primary))",
      boxShadow: "0 16px 42px -26px rgb(0 0 0 / 0.3), 0 2px 10px rgb(0 0 0 / 0.04)",
    }}>
      <div style={{
        display: "flex",
        minHeight: "48px",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "5px 10px 9px 12px",
        color: "var(--text-primary)",
      }}>
        <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: "10px" }}>
          <span aria-hidden="true" style={{ display: "flex", flexShrink: 0, gap: "4px" }}>
            {[0.6, 0.4, 0.25].map((opacity) => (
              <span key={opacity} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "currentColor", opacity }} />
            ))}
          </span>
          <span aria-hidden="true" style={{ height: "18px", width: "1px", flexShrink: 0, background: "var(--border-primary)" }} />
          <span title={filename || language || "Plain text"} style={{
            display: "flex",
            minWidth: 0,
            alignItems: "center",
            gap: "7px",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "11px",
            fontWeight: 600,
          }}>
            <FileCode2 size={14} aria-hidden="true" style={{ flexShrink: 0, color: "var(--text-secondary)" }} />
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename || language || "Plain text"}</span>
          </span>
        </div>
        <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: "8px" }}>
          {filename && language && <span aria-hidden="true" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "10px" }}>{language}</span>}
          <button
            type="button"
            onClick={copy}
            aria-label={copyStatus === "copied" ? "Code copied" : copyStatus === "error" ? "Copy failed" : "Copy code"}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-3 text-xs font-medium text-text-primary transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:bg-neutral-700"
            style={{ minHeight: "36px" }}
          >
            {copyStatus === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copyStatus === "copied" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre tabIndex={0} aria-label={`Code snippet${language ? ` in ${language}` : ""}`} style={{
        margin: 0,
        maxWidth: "100%",
        overflowX: "auto",
        border: 0,
        borderRadius: "11px",
        boxShadow: "none",
        padding: "clamp(18px, 3vw, 24px)",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        tabSize: 2,
      }}><code style={{ fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }} dangerouslySetInnerHTML={{ __html: highlight(code) }} /></pre>
      <span role="status" className="sr-only">{copyStatus === "copied" ? "Code copied" : copyStatus === "error" ? "Could not copy code" : ""}</span>
    </div>
  );
}
