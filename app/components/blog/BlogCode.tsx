"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
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
      margin: "1.75rem 0 2rem",
      overflow: "hidden",
      border: "1px solid var(--border-primary)",
      borderRadius: "14px",
      background: "var(--bg-primary)",
      boxShadow: "0 6px 22px rgb(0 0 0 / 0.04)",
    }}>
      <div style={{
        display: "flex",
        minHeight: "48px",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "7px 12px 7px 16px",
        borderBottom: "1px solid var(--border-primary)",
        background: "color-mix(in srgb, var(--text-primary) 3%, var(--bg-primary))",
      }}>
        <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: "12px" }}>
          <span aria-hidden="true" style={{ display: "flex", flexShrink: 0, gap: "4px" }}>
            {[0.38, 0.27, 0.18].map((opacity) => (
              <span key={opacity} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-secondary)", opacity }} />
            ))}
          </span>
          <span title={filename || language || "Plain text"} style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "11px",
            fontWeight: 500,
          }}>{filename || language || "Plain text"}</span>
          {filename && language && <span aria-hidden="true" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "10px" }}>{language}</span>}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copyStatus === "copied" ? "Code copied" : copyStatus === "error" ? "Copy failed" : "Copy code"}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-primary px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:bg-white/10"
          style={{ minHeight: "32px" }}
        >
          {copyStatus === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copyStatus === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Code snippet${language ? ` in ${language}` : ""}`} style={{
        margin: 0,
        maxWidth: "100%",
        overflowX: "auto",
        border: 0,
        borderRadius: 0,
        boxShadow: "none",
        padding: "clamp(14px, 3vw, 20px)",
        background: "transparent",
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
