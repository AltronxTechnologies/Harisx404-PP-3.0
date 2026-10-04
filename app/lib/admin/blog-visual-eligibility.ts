import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const supported = new Set([
  "root", "paragraph", "text", "heading", "strong", "emphasis", "delete",
  "inlineCode", "code", "link", "image", "list", "listItem", "blockquote",
  "thematicBreak", "break", "table", "tableRow", "tableCell",
]);

export function canUseVisualBlogEditor(source: string) {
  try {
    const tree = createProcessor({ remarkPlugins: [remarkGfm] }).parse(source);
    const visit = (node: { type: string; children?: unknown[] }): boolean =>
      supported.has(node.type) && (node.children ?? []).every((child) => visit(child as typeof node));
    return visit(tree);
  } catch {
    return false;
  }
}
