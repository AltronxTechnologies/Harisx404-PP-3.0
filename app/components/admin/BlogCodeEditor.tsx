"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlignLeft,
  Bold,
  Check,
  Code,
  Copy,
  Columns2,
  Eye,
  FileCode,
  Heading2,
  Heading3,
  Heading4,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Maximize2,
  Minimize2,
  Quote,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Wand2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BlogMdxValidationError, validateBlogMdx } from "@/app/lib/blog-mdx-policy.mjs";

interface BlogCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errorId?: string;
  onExtractFrontmatter?: (rawText: string) => void;
}

type ViewMode = "code" | "split" | "preview";

export function BlogCodeEditor({
  value,
  onChange,
  errorId,
  onExtractFrontmatter,
}: BlogCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [expanded, setExpanded] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectionLen, setSelectionLen] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mdxValidation, setMdxValidation] = useState<{
    valid: boolean;
    errorLine?: number;
    errorReason?: string;
  }>({ valid: true });

  const lines = useMemo(() => value.split("\n"), [value]);
  const linesCount = lines.length;
  const wordsCount = useMemo(
    () => (value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0),
    [value]
  );
  const readMinutes = Math.max(1, Math.ceil(wordsCount / 200));
  const hasFrontmatter = value.trimStart().startsWith("---");

  // Validate MDX in real-time (debounced 350ms)
  useEffect(() => {
    if (!value.trim()) {
      setMdxValidation({ valid: true });
      return;
    }
    const timer = setTimeout(() => {
      try {
        validateBlogMdx(value);
        setMdxValidation({ valid: true });
      } catch (err: unknown) {
        if (err instanceof BlogMdxValidationError || err instanceof Error) {
          const match = /line\s+(\d+)/i.exec(err.message);
          const errorLine = match ? parseInt(match[1], 10) : undefined;
          setMdxValidation({
            valid: false,
            errorLine,
            errorReason: err.message.replace(/^Blog\s+MDX\s+/i, ""),
          });
        } else {
          setMdxValidation({ valid: false, errorReason: "Invalid MDX syntax" });
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  // Synchronize gutter scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorAndSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    setSelectionLen(Math.abs(end - pos));

    const before = textarea.value.slice(0, pos);
    const beforeLines = before.split("\n");
    setCursorPos({
      line: beforeLines.length,
      col: (beforeLines[beforeLines.length - 1]?.length ?? 0) + 1,
    });
  };

  // Jump cursor directly to a line number
  const jumpToLine = (targetLine: number) => {
    const textarea = textareaRef.current;
    if (!textarea || targetLine < 1) return;
    let charIndex = 0;
    for (let i = 0; i < Math.min(targetLine - 1, lines.length); i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);
    updateCursorAndSelection();

    // Scroll to position
    const lineHeight = 23; // approx px per line
    textarea.scrollTop = Math.max(0, (targetLine - 4) * lineHeight);
    if (gutterRef.current) gutterRef.current.scrollTop = textarea.scrollTop;
  };

  // Insert snippet helper
  const insertSnippet = (prefix: string, suffix = "", defaultPlaceholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value}\n\n${prefix}${defaultPlaceholder}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const textToInsert = selected || defaultPlaceholder;
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const nextValue = value.slice(0, start) + replacement + value.slice(end);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + textToInsert.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      updateCursorAndSelection();
    }, 0);
  };

  // Smart keyboard handling: Tab indentation, Enter auto-indent, Auto-pairs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. Tab / Shift+Tab indent
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Unindent
        if (start === end) {
          // Single line unindent
          const before = value.slice(0, start);
          const lineStart = before.lastIndexOf("\n") + 1;
          const currentLine = value.slice(lineStart, end);
          if (currentLine.startsWith("  ")) {
            const nextVal = value.slice(0, lineStart) + currentLine.slice(2) + value.slice(end);
            onChange(nextVal);
            setTimeout(() => {
              textarea.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, start - 2));
              updateCursorAndSelection();
            }, 0);
          }
        } else {
          // Multiline unindent
          const before = value.slice(0, start);
          const lineStart = before.lastIndexOf("\n") + 1;
          const after = value.slice(end);
          const lineEndOffset = after.indexOf("\n");
          const blockEnd = lineEndOffset === -1 ? value.length : end + lineEndOffset;
          const block = value.slice(lineStart, blockEnd);

          const unindented = block
            .split("\n")
            .map((l) => (l.startsWith("  ") ? l.slice(2) : l.startsWith(" ") ? l.slice(1) : l))
            .join("\n");

          const diff = block.length - unindented.length;
          onChange(value.slice(0, lineStart) + unindented + value.slice(blockEnd));
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, Math.max(lineStart, end - diff));
            updateCursorAndSelection();
          }, 0);
        }
      } else {
        // Tab: Indent
        if (start === end) {
          // Insert 2 spaces
          const nextVal = value.slice(0, start) + "  " + value.slice(end);
          onChange(nextVal);
          setTimeout(() => {
            textarea.setSelectionRange(start + 2, start + 2);
            updateCursorAndSelection();
          }, 0);
        } else {
          // Multiline indent
          const before = value.slice(0, start);
          const lineStart = before.lastIndexOf("\n") + 1;
          const after = value.slice(end);
          const lineEndOffset = after.indexOf("\n");
          const blockEnd = lineEndOffset === -1 ? value.length : end + lineEndOffset;
          const block = value.slice(lineStart, blockEnd);

          const indented = block
            .split("\n")
            .map((l) => "  " + l)
            .join("\n");

          const diff = indented.length - block.length;
          onChange(value.slice(0, lineStart) + indented + value.slice(blockEnd));
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, end + diff);
            updateCursorAndSelection();
          }, 0);
        }
      }
      return;
    }

    // 2. Enter auto-indent
    if (e.key === "Enter" && !e.shiftKey) {
      const before = value.slice(0, start);
      const lineStart = before.lastIndexOf("\n") + 1;
      const currentLine = before.slice(lineStart);
      const indentMatch = currentLine.match(/^(\s+)/);
      const leadingSpaces = indentMatch ? indentMatch[1] : "";

      // List continuations
      const bulletMatch = currentLine.match(/^(\s*)([-*+]\s+)/);
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);

      if (bulletMatch) {
        // If empty bullet line, pressing Enter clears the bullet
        if (currentLine.trim() === bulletMatch[2].trim()) {
          e.preventDefault();
          const nextVal = value.slice(0, lineStart) + value.slice(start);
          onChange(nextVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
            updateCursorAndSelection();
          }, 0);
          return;
        }
        e.preventDefault();
        const continuation = `\n${bulletMatch[1]}${bulletMatch[2]}`;
        const nextVal = value.slice(0, start) + continuation + value.slice(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(start + continuation.length, start + continuation.length);
          updateCursorAndSelection();
        }, 0);
        return;
      }

      if (numMatch) {
        // If empty numbered line, pressing Enter clears it
        if (currentLine.trim() === `${numMatch[2]}.`) {
          e.preventDefault();
          const nextVal = value.slice(0, lineStart) + value.slice(start);
          onChange(nextVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
            updateCursorAndSelection();
          }, 0);
          return;
        }
        e.preventDefault();
        const nextNum = parseInt(numMatch[2], 10) + 1;
        const continuation = `\n${numMatch[1]}${nextNum}. `;
        const nextVal = value.slice(0, start) + continuation + value.slice(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(start + continuation.length, start + continuation.length);
          updateCursorAndSelection();
        }, 0);
        return;
      }

      if (leadingSpaces) {
        e.preventDefault();
        const nextVal = value.slice(0, start) + `\n${leadingSpaces}` + value.slice(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1 + leadingSpaces.length, start + 1 + leadingSpaces.length);
          updateCursorAndSelection();
        }, 0);
        return;
      }
    }

    // 3. Auto-pair brackets and quotes
    const pairs: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (pairs[e.key]) {
      const open = e.key;
      const close = pairs[open];
      if (start !== end) {
        e.preventDefault();
        const selected = value.slice(start, end);
        const nextVal = value.slice(0, start) + open + selected + close + value.slice(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, end + 1);
          updateCursorAndSelection();
        }, 0);
        return;
      } else if (open === close && value[start] === close) {
        // Skip over closing quote/tick if typing it right before
        e.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorAndSelection();
        return;
      }
    }

    // 4. Backspace inside empty pair
    if (e.key === "Backspace" && start === end && start > 0) {
      const prev = value[start - 1];
      const next = value[start];
      if (
        (prev === "(" && next === ")") ||
        (prev === "[" && next === "]") ||
        (prev === "{" && next === "}") ||
        (prev === '"' && next === '"') ||
        (prev === "'" && next === "'") ||
        (prev === "`" && next === "`")
      ) {
        e.preventDefault();
        const nextVal = value.slice(0, start - 1) + value.slice(start + 1);
        onChange(nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(start - 1, start - 1);
          updateCursorAndSelection();
        }, 0);
        return;
      }
    }

    // 5. Ctrl/Cmd formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        insertSnippet("**", "**", "bold text");
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        insertSnippet("*", "*", "italic text");
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        insertSnippet("[", "](https://example.com)", "link text");
      } else if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        insertSnippet("`", "`", "code");
      }
    }
  };

  const stripFrontmatter = () => {
    const cleaned = value.replace(/^---[\s\S]*?---\s*[\r\n]*/, "");
    onChange(cleaned);
  };

  const cleanWhitespace = () => {
    const cleaned = value
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
    onChange(cleaned);
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard fallback */
    }
  };

  // Pre-process MDX text for react-markdown preview (handle custom tags gently)
  const previewMarkdown = useMemo(() => {
    if (!value) return "";
    let content = value.replace(/^---[\s\S]*?---\s*[\r\n]*/, "");

    // Transform custom tags into clean preview equivalents
    content = content.replace(
      /<Callout\s+emoji=["']([^"']*)["']\s*>([\s\S]*?)<\/Callout>/gi,
      (_m, emoji, inner) => `> **${emoji || "💡"} Note:**\n>\n> ${inner.trim().replace(/\n/g, "\n> ")}`
    );

    content = content.replace(
      /<(?:Ideaquote|Thoughtquote|Warningquote|Infoquote|Announcementquote)>([\s\S]*?)<\/(?:Ideaquote|Thoughtquote|Warningquote|Infoquote|Announcementquote)>/gi,
      (_m, inner) => `> ${inner.trim().replace(/\n/g, "\n> ")}`
    );

    return content;
  }, [value]);

  const editorHeight = expanded ? 880 : 560;

  return (
    <div
      data-color-mode="dark"
      className="admin-mdx-editor min-w-0 overflow-hidden rounded-2xl border border-[#27272a] bg-[#090a10] shadow-2xl transition-all focus-within:border-accent-signal/60 focus-within:ring-2 focus-within:ring-accent-signal/20"
    >
      {/* Top Window Titlebar with Traffic Lights, File Info & View Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#101118] px-4 py-2.5 text-xs text-ink-secondary">
        {/* Left: Window Dots & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-white/90">
            <FileCode className="size-3.5 text-accent-signal" />
            <span>article.mdx</span>
          </div>
          <span className="hidden sm:inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
            {linesCount} lines · {wordsCount} words · {readMinutes} min read
          </span>
        </div>

        {/* Center: MDX Syntax Validation Status Pill */}
        <div className="flex items-center gap-2">
          {mdxValidation.valid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span>Valid MDX</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => mdxValidation.errorLine && jumpToLine(mdxValidation.errorLine)}
              title={
                mdxValidation.errorLine
                  ? `Click to jump to line ${mdxValidation.errorLine}`
                  : "Syntax warning in MDX"
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-200 hover:bg-amber-900/60 transition-colors"
            >
              <AlertCircle className="size-3 text-amber-400 shrink-0" />
              <span className="max-w-[280px] truncate">
                {mdxValidation.errorLine ? `Line ${mdxValidation.errorLine}: ` : ""}
                {mdxValidation.errorReason || "Syntax warning"}
              </span>
            </button>
          )}
        </div>

        {/* Right: View Mode Switcher (Code | Split | Preview) */}
        <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "code"
                ? "bg-accent-signal text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code className="size-3.5" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "split"
                ? "bg-accent-signal text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns2 className="size-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-accent-signal text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Formatting & Insert Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 bg-[#0d0e14] px-3 py-1.5 text-slate-300">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertSnippet("## ", "", "Heading 2")}
            title="Heading 2 (##)"
            aria-label="Insert Heading 2"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("### ", "", "Heading 3")}
            title="Heading 3 (###)"
            aria-label="Insert Heading 3"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("#### ", "", "Heading 4")}
            title="Heading 4 (####)"
            aria-label="Insert Heading 4"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading4 className="size-3.5" />
          </button>

          <span className="mx-1 h-3.5 w-px bg-white/15" aria-hidden="true" />

          {/* Inline formatting */}
          <button
            type="button"
            onClick={() => insertSnippet("**", "**", "bold text")}
            title="Bold (Ctrl+B)"
            aria-label="Insert Bold text"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("*", "*", "italic text")}
            title="Italic (Ctrl+I)"
            aria-label="Insert Italic text"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("~~", "~~", "strikethrough text")}
            title="Strikethrough (~~)"
            aria-label="Insert Strikethrough text"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("`", "`", "code")}
            title="Inline Code (Ctrl+E)"
            aria-label="Insert Inline Code"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Code className="size-3.5" />
          </button>

          <span className="mx-1 h-3.5 w-px bg-white/15" aria-hidden="true" />

          {/* Code block */}
          <button
            type="button"
            onClick={() => insertSnippet("```typescript\n", "\n```", "// TypeScript code here")}
            title="Code Block (```typescript)"
            aria-label="Insert Code Block"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <FileCode className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("[", "](https://example.com)", "link title")}
            title="Link (Ctrl+K)"
            aria-label="Insert Link"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <LinkIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("> ", "", "quoted text")}
            title="Blockquote (>)"
            aria-label="Insert Blockquote"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Quote className="size-3.5" />
          </button>

          <span className="mx-1 h-3.5 w-px bg-white/15" aria-hidden="true" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertSnippet("- ", "", "bullet item")}
            title="Bullet list (-)"
            aria-label="Insert Bullet list"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("1. ", "", "numbered item")}
            title="Numbered list (1.)"
            aria-label="Insert Numbered list"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <ListOrdered className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("- [ ] ", "", "task item")}
            title="Task item (- [ ])"
            aria-label="Insert Task list"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <ListTodo className="size-3.5" />
          </button>

          <span className="mx-1 h-3.5 w-px bg-white/15" aria-hidden="true" />

          {/* Table & Callout */}
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                "| Feature | Description | Status |\n| :--- | :--- | :--- |\n| Architecture | Scalable design | Complete |\n| Security | Least privilege | Active |\n"
              )
            }
            title="Markdown Table"
            aria-label="Insert Markdown Table"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <TableIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '<Callout emoji="💡">\n',
                "\n</Callout>",
                "Write your callout note or tip here."
              )
            }
            title="Callout Box (<Callout>)"
            aria-label="Insert Callout Box"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors text-amber-300"
          >
            <Info className="size-3.5" />
          </button>
        </div>

        {/* Right tools: Clean, Copy, Expand */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={cleanWhitespace}
            title="Clean whitespace & trailing spaces"
            aria-label="Clean whitespace"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <Wand2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={copyAll}
            title="Copy article MDX to clipboard"
            aria-label="Copy article MDX"
            className="flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Standard height (560px)" : "Expand height (880px)"}
            aria-label={expanded ? "Standard height" : "Expand height"}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            <span>{expanded ? "560px" : "880px"}</span>
          </button>
        </div>
      </div>

      {/* Frontmatter alert banner if present */}
      {hasFrontmatter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/30 bg-indigo-950/40 px-4 py-2.5 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-signal shrink-0 animate-pulse" />
            <span>
              <strong>YAML Frontmatter detected:</strong> Article metadata is located at the top of this content.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onExtractFrontmatter && (
              <button
                type="button"
                onClick={() => onExtractFrontmatter(value)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-signal px-3.5 py-1 text-xs font-semibold text-white shadow-md hover:bg-accent-signal/90 transition-all"
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

      {/* Main Workspace: Code, Split, or Preview */}
      <div
        className="relative flex min-w-0 bg-[#090a10]"
        style={{ height: `${editorHeight}px` }}
      >
        {/* Editor Area (Shown in "code" or "split") */}
        {viewMode !== "preview" && (
          <div
            className={`relative flex min-w-0 ${
              viewMode === "split" ? "w-1/2 border-r border-white/10" : "w-full"
            } h-full`}
          >
            {/* Line Numbers Gutter */}
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="w-12 select-none overflow-hidden bg-[#0c0d14] py-4 text-right font-mono text-[12px] leading-[23px] text-slate-600 border-r border-white/5 pr-2.5"
            >
              {Array.from({ length: Math.max(linesCount, 1) }).map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrent = lineNum === cursorPos.line;
                const isError = lineNum === mdxValidation.errorLine;
                return (
                  <div
                    key={lineNum}
                    onClick={() => jumpToLine(lineNum)}
                    className={`cursor-pointer transition-colors ${
                      isError
                        ? "font-bold text-red-400 bg-red-950/40 rounded"
                        : isCurrent
                        ? "font-bold text-slate-200"
                        : "hover:text-slate-400"
                    }`}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>

            {/* Code Textarea with High-Performance Monospace Typography */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorAndSelection}
              onClick={updateCursorAndSelection}
              onSelect={updateCursorAndSelection}
              aria-label="Blog article MDX source"
              aria-describedby={errorId}
              aria-invalid={Boolean(errorId)}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent py-4 px-4 font-mono text-[13.5px] leading-[23px] text-[#f8fafc] placeholder-slate-600 outline-none caret-[#818cf8] selection:bg-indigo-600/40"
              style={{
                tabSize: 2,
                whiteSpace: wordWrap ? "pre-wrap" : "pre",
                wordBreak: wordWrap ? "break-word" : "normal",
                overflowX: wordWrap ? "hidden" : "auto",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              placeholder="# Write your article MDX here...&#10;&#10;Supports headings, code fences, markdown tables, callout blocks, and custom components."
            />
          </div>
        )}

        {/* Live Preview Panel (Shown in "split" or "preview") */}
        {viewMode !== "code" && (
          <div
            ref={previewScrollRef}
            className={`${
              viewMode === "split" ? "w-1/2" : "w-full"
            } h-full overflow-y-auto bg-[#07070a] p-6 text-slate-200`}
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                Live Article Render
              </span>
              <span className="text-[11px] text-slate-500">
                Rendered with GFM & typography styles
              </span>
            </div>

            {previewMarkdown.trim() ? (
              <div className="prose prose-invert max-w-none text-[15px] leading-relaxed [overflow-wrap:anywhere]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mt-6 mb-4 text-2xl font-bold tracking-tight text-white border-b border-white/10 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-5 mb-2 text-lg font-medium text-slate-100">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="my-3 text-slate-300 leading-relaxed">{children}</p>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-indigo-500 bg-indigo-950/20 py-2 pl-4 pr-3 text-slate-200 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "");
                      if (!inline) {
                        return (
                          <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#0d0e15]">
                            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-400">
                              <span>{match ? match[1] : "code"}</span>
                            </div>
                            <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed font-mono text-indigo-200">
                              <code {...props}>{children}</code>
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-indigo-300"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-left text-sm text-slate-300 border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="border-b border-white/10 bg-white/5 font-semibold text-white">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => <th className="p-3">{children}</th>,
                    td: ({ children }) => (
                      <td className="border-t border-white/5 p-3 text-slate-300">
                        {children}
                      </td>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-3 list-disc pl-6 space-y-1 text-slate-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3 list-decimal pl-6 space-y-1 text-slate-300">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="my-6 border-white/10" />,
                  }}
                >
                  {previewMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500">
                <FileCode className="size-10 mb-2 opacity-30" />
                <p className="text-sm">No content to preview.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Type markdown or code on the left to see the live rendering here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0c0d14] px-4 py-1.5 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-300">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          {selectionLen > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-indigo-300">{selectionLen} selected</span>
            </>
          )}
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
