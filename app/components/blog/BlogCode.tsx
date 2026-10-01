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
  const match = /^language-([^:\s]+)/.exec(codeElement.props.className || "");
  const language = match?.[1] || "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="blog-code-window not-prose" style={{
      width: "100%",
      minWidth: 0,
      margin: "2rem 0 2.25rem",
      overflow: "hidden",
      border: "1px solid var(--border-primary)",
      borderRadius: "14px",
      background: "#061b2d",
      boxShadow: "0 12px 32px -22px rgb(0 0 0 / 0.36)",
    }}>
      <div style={{
        display: "flex",
        minHeight: "44px",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        borderBottom: "1px solid rgb(255 255 255 / 0.12)",
        padding: "4px clamp(12px, 3vw, 20px)",
        background: "#061b2d",
      }}>
        <span aria-hidden="true" style={{ display: "flex", flexShrink: 0, gap: "6px" }}>
          {["#ff605c", "#ffbd44", "#29c95f"].map((color) => (
            <span key={color} style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
          ))}
        </span>
        <div style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
          <button
            type="button"
            onClick={copy}
            aria-label={copyStatus === "copied" ? "Code copied" : copyStatus === "error" ? "Copy failed" : "Copy code"}
            className="flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2.5 text-[11px] font-medium text-slate-100 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ minHeight: "32px" }}
          >
            {copyStatus === "copied" ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
            {copyStatus === "copied" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre tabIndex={0} aria-label={`Code snippet${language ? ` in ${language}` : ""}`} style={{
        margin: 0,
        maxWidth: "100%",
        overflowX: "auto",
        overscrollBehaviorX: "contain",
        border: 0,
        borderRadius: 0,
        boxShadow: "none",
        padding: "clamp(18px, 3vw, 26px)",
        paddingTop: "16px",
        background: "#061b2d",
        color: "#d8e6f4",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "clamp(13px, 2vw, 16px)",
        lineHeight: "1.75",
        tabSize: 2,
      }}><code style={{ fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }} {...(language ? { dangerouslySetInnerHTML: { __html: highlight(code) } } : { children: code })} /></pre>
      <span role="status" className="sr-only">{copyStatus === "copied" ? "Code copied" : copyStatus === "error" ? "Could not copy code" : ""}</span>
    </div>
  );
}
