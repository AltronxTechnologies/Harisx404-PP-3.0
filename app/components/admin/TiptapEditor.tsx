"use client";

import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, Minus, Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Code, Undo, Redo, Code2, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaPickerModal } from "./MediaPickerModal";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  story?: boolean;
  blogTools?: boolean;
}

export function validBlogLinkUrl(input: string): boolean {
  const url = input.trim();
  if (!url || /[\u0000-\u001f\u007f]/.test(input) || /[\s\\<>"']/.test(url) || url.startsWith("//")) return false;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return Boolean(parsed.hostname) && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }
  return !/^[a-z][a-z\d+.-]*:/i.test(url) && (/^[/.#?]/.test(url) || /^[a-z\d_-]/i.test(url));
}

const TableTools = ({ editor }: { editor: Editor }) => {
  const isInTable = useEditorState({ editor, selector: ({ editor }) => editor.isActive("table") });
  if (!isInTable) return null;

  return (
    <div role="group" aria-label="Edit table" className="flex flex-wrap items-center gap-1">
      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} aria-label="Add row below"
        className="rounded p-2 text-sm text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">+ Row</button>
      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} aria-label="Delete row"
        className="rounded p-2 text-sm text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">- Row</button>
      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} aria-label="Add column to right"
        className="rounded p-2 text-sm text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">+ Column</button>
      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} aria-label="Delete column"
        className="rounded p-2 text-sm text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">- Column</button>
      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} aria-label="Delete table"
        className="rounded p-2 text-sm text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">Delete table</button>
    </div>
  );
};

const MenuBar = ({ editor, story, blogTools }: { editor: Editor | null; story: boolean; blogTools: boolean }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkRange, setLinkRange] = useState({ from: 0, to: 0, existing: false });
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imagePosition, setImagePosition] = useState(0);

  if (!editor) {
    return null;
  }

  const openLink = () => {
    setImageUrl("");
    const { from, to } = editor.state.selection;
    const existing = editor.isActive("link");
    setLinkRange({ from, to, existing });
    setLinkUrl(existing ? editor.getAttributes("link").href || "" : "");
    setLinkText(from === to && !existing ? "" : editor.state.doc.textBetween(from, to));
    setLinkError("");
    setLinkOpen(true);
  };

  const saveLink = () => {
    const href = linkUrl.trim();
    if (!validBlogLinkUrl(href)) {
      setLinkError("Enter a valid HTTP(S) or relative URL.");
      return;
    }
    const { from, to, existing } = linkRange;
    if (!existing && from === to) {
      if (!linkText.trim()) {
        setLinkError("Enter link text.");
        return;
      }
      editor.chain().focus().setTextSelection(from).insertContent({ type: "text", text: linkText.trim(), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().setTextSelection({ from, to }).extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  const insertImage = () => {
    if (!imageAlt.trim()) return;
    editor.chain().focus().setTextSelection(imagePosition).setImage({
      src: imageUrl,
      alt: imageAlt.trim(),
      title: imageCaption.trim() || undefined,
    }).run();
    setImageUrl("");
  };

  const handleAiAssist = async (action: string) => {
    try {
      setAiLoading(true);
      setAiMenuOpen(false);
      
      const content = action === 'improve' || action === 'grammar'
        ? editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            ' '
          )
        : (editor.storage as any).markdown.getMarkdown();

      if ((action === 'improve' || action === 'grammar') && !content) {
        alert("Please select some text first.");
        setAiLoading(false);
        return;
      }

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content })
      });

      if (!res.ok) throw new Error("AI request failed");
      
      const data = await res.json();
      
      if (action === 'improve' || action === 'grammar') {
        editor.chain().focus().insertContent(data.result).run();
      } else {
        alert(`AI Suggestion:\n\n${data.result}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get AI assistance.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
    <div className="flex flex-wrap items-center gap-1 border-b border-border-hairline bg-surface-base p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("bold") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        aria-label="Bold"
        aria-pressed={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("italic") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        aria-label="Italic"
        aria-pressed={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      
      {!story && (
        <>
          <div className="w-px h-6 bg-border-hairline mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
            aria-label="Heading 2"
            aria-pressed={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
        </>
      )}

      {blogTools && (
        <>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3" title="Heading 3" aria-pressed={editor.isActive("heading", { level: 3 })}
            className="p-2 rounded text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
            <Heading3 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontal rule" title="Horizontal rule"
            className="p-2 rounded text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={openLink} aria-label="Insert or edit link" title="Insert or edit link"
            aria-expanded={linkOpen} aria-pressed={editor.isActive("link")}
            className="p-2 rounded text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
            <LinkIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => {
            setLinkOpen(false);
            setImagePosition(editor.state.selection.to);
            setImagePickerOpen(true);
          }} aria-label="Insert image" title="Insert image"
            className="p-2 rounded text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
            <ImageIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
            aria-label="Insert 2 by 2 table" title="Insert 2 by 2 table"
            className="p-2 rounded text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-signal">
            <TableIcon className="h-4 w-4" />
          </button>
          <TableTools editor={editor} />
        </>
      )}

      <div className="w-px h-6 bg-border-hairline mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("bulletList") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        aria-label="Bullet list"
        aria-pressed={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("orderedList") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        aria-label="Numbered list"
        aria-pressed={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      {!story && <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("blockquote") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        aria-label="Quote"
        aria-pressed={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>}

      {!story && (
        <>
          <div className="w-px h-6 bg-border-hairline mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("code") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
            aria-label="Inline code"
            aria-pressed={editor.isActive("code")}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("codeBlock") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
            aria-label="Code block"
            aria-pressed={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </>
      )}

      <div className="w-px h-6 bg-border-hairline mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-surface-raised transition-colors text-ink-secondary disabled:opacity-50"
        aria-label="Undo"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-surface-raised transition-colors text-ink-secondary disabled:opacity-50"
        aria-label="Redo"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>

      {!story && (
        <>
          <div className="w-px h-6 bg-border-hairline mx-1" />
          <div className="relative">
        <button
          type="button"
          onClick={() => setAiMenuOpen(!aiMenuOpen)}
          disabled={aiLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent-signal/10 text-accent-signal hover:bg-accent-signal/20 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI Assist
          <ChevronDown className="h-3 w-3" />
        </button>

        {aiMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface-base border border-border-hairline rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={() => handleAiAssist('improve')}
              className="text-left px-4 py-2 text-sm text-ink-primary hover:bg-surface-raised transition-colors border-b border-border-hairline"
            >
              ✨ Improve Selection
            </button>
            <button
              type="button"
              onClick={() => handleAiAssist('grammar')}
              className="text-left px-4 py-2 text-sm text-ink-primary hover:bg-surface-raised transition-colors border-b border-border-hairline"
            >
              📝 Fix Grammar (Selection)
            </button>
            <button
              type="button"
              onClick={() => handleAiAssist('summary')}
              className="text-left px-4 py-2 text-sm text-ink-primary hover:bg-surface-raised transition-colors border-b border-border-hairline"
            >
              📑 Generate Summary
            </button>
            <button
              type="button"
              onClick={() => handleAiAssist('title')}
              className="text-left px-4 py-2 text-sm text-ink-primary hover:bg-surface-raised transition-colors border-b border-border-hairline"
            >
              💡 Suggest Titles
            </button>
            <button
              type="button"
              onClick={() => handleAiAssist('tags')}
              className="text-left px-4 py-2 text-sm text-ink-primary hover:bg-surface-raised transition-colors"
            >
              🏷️ Suggest Tags
            </button>
          </div>
        )}
          </div>
        </>
      )}
    </div>
    {blogTools && linkOpen && (
      <div className="flex flex-wrap items-end gap-2 border-b border-border-hairline bg-surface-base p-3" role="group" aria-label="Edit link">
        {linkRange.from === linkRange.to && !linkRange.existing && (
          <label className="flex flex-col gap-1 text-sm text-ink-primary">Link text
            <input value={linkText} onChange={(event) => setLinkText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveLink(); } }} className="rounded border border-border-hairline bg-surface-raised p-2" />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm text-ink-primary">URL
            <input type="text" value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveLink(); } }}
            aria-invalid={Boolean(linkError)} aria-describedby={linkError ? "blog-link-error" : undefined}
            autoFocus className="rounded border border-border-hairline bg-surface-raised p-2" placeholder="https://example.com or /blog/post" />
        </label>
        <button type="button" onClick={saveLink} className="rounded border border-border-hairline p-2 text-sm hover:bg-surface-raised">Apply link</button>
        {linkRange.existing && (
          <button type="button" onClick={() => {
            editor.chain().focus().setTextSelection({ from: linkRange.from, to: linkRange.to }).extendMarkRange("link").unsetLink().run();
            setLinkOpen(false);
          }} className="rounded border border-border-hairline p-2 text-sm hover:bg-surface-raised">Remove link</button>
        )}
        <button type="button" onClick={() => { setLinkOpen(false); editor.commands.focus(); }} className="rounded border border-border-hairline p-2 text-sm hover:bg-surface-raised">Cancel</button>
        {linkError && <p id="blog-link-error" role="alert" className="w-full text-sm text-red-500">{linkError}</p>}
      </div>
    )}
    {blogTools && imageUrl && (
      <div role="group" aria-label="Image details" className="flex flex-wrap items-end gap-2 border-b border-border-hairline bg-surface-base p-3">
        <label className="flex flex-col gap-1 text-sm text-ink-primary">Alt text (required)
          <input required value={imageAlt} onChange={(event) => setImageAlt(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); insertImage(); } }}
            className="rounded border border-border-hairline bg-surface-raised p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-primary">Caption (optional)
          <input value={imageCaption} onChange={(event) => setImageCaption(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); insertImage(); } }}
            className="rounded border border-border-hairline bg-surface-raised p-2" />
        </label>
        <button type="button" disabled={!imageAlt.trim()} onClick={insertImage} className="rounded border border-border-hairline p-2 text-sm hover:bg-surface-raised disabled:opacity-50">Insert image</button>
        <button type="button" onClick={() => setImageUrl("")} className="rounded border border-border-hairline p-2 text-sm hover:bg-surface-raised">Cancel</button>
      </div>
    )}
    {blogTools && <MediaPickerModal isOpen={imagePickerOpen} onClose={() => setImagePickerOpen(false)} onSelect={(media) => {
      const src = media.secure_url || media.url;
      if (!/^https:\/\//i.test(src) && !/^\/(?!\/)/.test(src)) return;
      setImageUrl(src);
      setImageAlt(media.alt_text || "");
      setImageCaption("");
    }} />}
    </>
  );
};

export function TiptapEditor({ value, onChange, label = "Case study", story = false, blogTools = false }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      blogTools ? StarterKit.configure({ link: { openOnClick: false } }) : StarterKit,
      ...(blogTools ? [Image, TableKit] : []),
      Markdown,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none ${story ? "min-h-36" : "min-h-[400px]"} p-4 text-ink-primary`,
        "aria-label": label,
      },
    },
    onUpdate: ({ editor }) => {
      // Get the markdown output and pass it back
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
  });

  // Handle external value changes (e.g. initial load)
  useEffect(() => {
    if (editor && (editor.storage as any).markdown.getMarkdown() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="rounded-xl overflow-hidden border border-border-hairline bg-surface-raised flex flex-col">
      <MenuBar editor={editor} story={story} blogTools={blogTools} />
      <div className="flex-1 overflow-y-auto max-h-[600px] cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
