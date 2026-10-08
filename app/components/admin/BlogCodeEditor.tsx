"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import {
  Bold,
  Italic,
  Code,
  FileCode,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Quote,
  List,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Sparkles,
  AlignLeft,
  Wand2,
} from "lucide-react";

export function BlogCodeEditor({
  value,
  onChange,
  errorId,
  onExtractFrontmatter,
}: {
  value: string;
  onChange: (value: string) => void;
  errorId?: string;
  onExtractFrontmatter?: (rawText: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const linesCount = value ? value.split("\n").length : 0;
  const wordsCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordsCount / 200));
  const hasFrontmatter = value.trimStart().startsWith("---");

  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const pos = target.selectionStart ?? 0;
    const before = target.value.slice(0, pos);
    const lines = before.split("\n");
    setCursorPos({
      line: lines.length,
      col: (lines[lines.length - 1]?.length ?? 0) + 1,
    });
  };

  const insertSnippet = (prefix: string, suffix = "", defaultText = "text") => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '.admin-mdx-editor textarea[aria-label="Blog article MDX source"]'
    );
    if (!textarea) {
      onChange(value ? `${value}\n\n${prefix}${defaultText}${suffix}` : `${prefix}${defaultText}${suffix}`);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const textToInsert = selected || defaultText;
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
    }, 0);
  };

  const stripFrontmatter = () => {
    const cleaned = value.replace(/^---[\s\S]*?---\s*[\r\n]*/, "");
    onChange(cleaned);
  };

  const cleanWhitespace = () => {
    // Strip trailing spaces per line and normalize 3+ consecutive newlines to 2
    const cleaned = value
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
    onChange(cleaned);
  };

  return (
    <div
      data-color-mode="dark"
      className="admin-mdx-editor min-w-0 overflow-hidden rounded-2xl border border-border-primary bg-[#090a10] shadow-2xl transition-all focus-within:border-accent-signal/60 focus-within:ring-2 focus-within:ring-accent-signal/20"
    >
      {/* Editor top bar with window frame & tools */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#101118] px-3.5 py-2 text-xs text-ink-secondary">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-white/90">
            article.mdx
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {linesCount} lines · {wordsCount} words · {readMinutes} min read
          </span>
        </div>

        {/* Formatting actions */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => insertSnippet("## ", "", "Heading 2")}
            title="Heading 2"
            aria-label="Insert Heading 2"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("### ", "", "Heading 3")}
            title="Heading 3"
            aria-label="Insert Heading 3"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("**", "**", "bold text")}
            title="Bold"
            aria-label="Insert Bold text"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("*", "*", "italic text")}
            title="Italic"
            aria-label="Insert Italic text"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("`", "`", "code")}
            title="Inline Code"
            aria-label="Insert Inline Code"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("```typescript\n", "\n```", "// code here")}
            title="Code Block"
            aria-label="Insert Code Block"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <FileCode className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("[", "](https://example.com)", "link title")}
            title="Link"
            aria-label="Insert Link"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <LinkIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("> ", "", "quoted text")}
            title="Blockquote"
            aria-label="Insert Blockquote"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Quote className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("- ", "", "list item")}
            title="List"
            aria-label="Insert Bullet List"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data 1 |\n")}
            title="Table"
            aria-label="Insert Table"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <TableIcon className="size-3.5" />
          </button>

          <span className="mx-1 h-3.5 w-px bg-white/15" aria-hidden="true" />

          {/* Clean whitespace formatting */}
          <button
            type="button"
            onClick={cleanWhitespace}
            title="Clean whitespace & blank lines"
            aria-label="Clean whitespace & blank lines"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors text-slate-400"
          >
            <Wand2 className="size-3.5" />
          </button>

          {/* Toggle expand height */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Standard height (520px)" : "Expand editor height (840px)"}
            aria-label={expanded ? "Standard height" : "Expand editor height"}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            <span>{expanded ? "520px" : "840px"}</span>
          </button>
        </div>
      </div>

      {/* Frontmatter alert banner if present */}
      {hasFrontmatter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/30 bg-indigo-950/40 px-3.5 py-2 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-signal shrink-0 animate-pulse" />
            <span>
              <strong>YAML Frontmatter detected:</strong> Contains article metadata (title, slug, summary, tags).
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onExtractFrontmatter && (
              <button
                type="button"
                onClick={() => onExtractFrontmatter(value)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-signal px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-accent-signal/90 transition-all"
              >
                <Sparkles className="size-3" />
                Auto-fill Form & Clean MDX
              </button>
            )}
            <button
              type="button"
              onClick={stripFrontmatter}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              Strip frontmatter only
            </button>
          </div>
        </div>
      )}

      {/* MDEditor with exact required properties */}
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        preview="edit"
        commands={[]}
        extraCommands={[]}
        height={expanded ? 840 : 520}
        visibleDragbar={false}
        textareaProps={{
          "aria-label": "Blog article MDX source",
          "aria-describedby": errorId,
          "aria-invalid": Boolean(errorId),
          spellCheck: false,
          onKeyUp: handleCursorMove,
          onClick: handleCursorMove,
          onSelect: handleCursorMove,
          style: {
            whiteSpace: wordWrap ? "pre-wrap" : "pre",
            wordBreak: wordWrap ? "break-word" : "normal",
            overflowX: wordWrap ? "hidden" : "auto",
          },
        }}
      />

      {/* Bottom status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0e0f16] px-3.5 py-1.5 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span className="text-white/20">|</span>
          <span>{linesCount} lines</span>
          <span className="text-white/20">|</span>
          <span>{wordsCount} words</span>
          <span className="text-white/20">|</span>
          <span>{readMinutes} min read</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Toggle word wrapping"
          >
            <AlignLeft className="size-3" />
            <span>Wrap: {wordWrap ? "ON" : "OFF"}</span>
          </button>
          <span className="text-white/20">|</span>
          <span>UTF-8</span>
          <span className="text-white/20">|</span>
          <span className="font-semibold text-accent-signal">MDX</span>
        </div>
      </div>
    </div>
  );
}
