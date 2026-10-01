import { createProcessor } from "@mdx-js/mdx";

/** Table of Contents utilities shared by extraction and MDX rendering. */

export interface TocHeading {
  level: 2 | 3 | 4 | 5 | 6;
  text: string;
  slug: string;
  number: string;
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
  let section = 0;
  let subsection = 0;

  for (const node of tree.children || []) {
    if (node.type !== "heading") continue;
    const text = textOf(node).trim();
    if (!text) continue;
    const base = slugify(text) || "section";
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    const slug = count ? `${base}-${count + 1}` : base;
    const level = node.depth === 1 ? 2 : node.depth;
    let number = "";
    if (level === 2) {
      section += 1;
      subsection = 0;
      number = String(section);
    } else if (level === 3) {
      if (!section) section = 1;
      subsection += 1;
      number = `${section}.${subsection}`;
    }
    if (/^(?:\d+[.)]|\d+(?:\.\d+)+[.)]?)\s/.test(text)) number = "";
    if (setIds) {
      if (node.depth === 1) node.depth = 2;
      node.data ||= {};
      node.data.hProperties = { ...node.data.hProperties, id: slug };
      if (number) node.data.hProperties["data-section-number"] = number;
    }
    if (level && level >= 2 && level <= 6) {
      headings.push({ level: level as TocHeading["level"], text, slug, number });
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
