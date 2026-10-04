"use client";

import MDEditor from "@uiw/react-md-editor";

export function BlogCodeEditor({ value, onChange, errorId }: { value: string; onChange: (value: string) => void; errorId?: string }) {
  return (
    <div data-color-mode="dark" className="admin-mdx-editor min-w-0 overflow-hidden rounded-2xl border border-border-primary">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        preview="edit"
        commands={[]}
        extraCommands={[]}
        height={520}
        visibleDragbar={false}
        textareaProps={{ "aria-label": "Blog article MDX source", "aria-describedby": errorId, "aria-invalid": Boolean(errorId), spellCheck: false }}
      />
    </div>
  );
}
