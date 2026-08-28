"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Code, Undo, Redo, Code2, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  if (!editor) {
    return null;
  }

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
    <div className="flex flex-wrap items-center gap-1 border-b border-border-hairline bg-surface-base p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("bold") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("italic") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      
      <div className="w-px h-6 bg-border-hairline mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border-hairline mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("bulletList") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("orderedList") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("blockquote") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border-hairline mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("code") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-surface-raised transition-colors ${editor.isActive("codeBlock") ? "bg-surface-raised text-accent-signal" : "text-ink-secondary"}`}
        title="Code Block"
      >
        <Code2 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border-hairline mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-surface-raised transition-colors text-ink-secondary disabled:opacity-50"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-surface-raised transition-colors text-ink-secondary disabled:opacity-50"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>

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
    </div>
  );
};

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-ink-primary",
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
    if (editor && value && (editor.storage as any).markdown.getMarkdown() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="rounded-xl overflow-hidden border border-border-hairline bg-surface-raised flex flex-col">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto max-h-[600px] cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
