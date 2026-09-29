import { createProcessor } from "@mdx-js/mdx";

/** Table of Contents utilities shared by extraction and MDX rendering. */

export interface TocHeading {
  level: 2 | 3;
  text: string;
  slug: string;
}

export function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

type MdNode = {
  type: string;
  depth?: number;
  value?: string;
  alt?: string | null;
  children?: MdNode[];
  data?: { hProperties?: Record<string, unknown> };
};

function textOf(node: MdNode): string {
  if (node.type === "image") return node.alt || "";
  return node.value || node.children?.map(textOf).join("") || "";
}

function headingsIn(tree: MdNode, setIds: boolean): TocHeading[] {
  const headings: TocHeading[] = [];
  const counts = new Map<string, number>();

  for (const node of tree.children || []) {
    if (node.type !== "heading") continue;
    const text = textOf(node).trim();
    if (!text) continue;
    const base = slugify(text) || "section";
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    const slug = count ? `${base}-${count + 1}` : base;
    if (setIds) {
      node.data ||= {};
      node.data.hProperties = { ...node.data.hProperties, id: slug };
    }
    if (node.depth === 2 || node.depth === 3) {
      headings.push({ level: node.depth, text, slug });
    }
  }
  return headings;
}

export function extractHeadingsFromMdx(content: string): TocHeading[] {
  try {
    return headingsIn(createProcessor().parse(content), false);
  } catch {
    return [];
  }
}

export function addHeadingIds(tree: MdNode): void {
  headingsIn(tree, true);
}
