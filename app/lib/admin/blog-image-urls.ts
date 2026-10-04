import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

export function blogImageUrls(content: string): string[] {
  try {
    const urls = new Set<string>();
    const definitions = new Map<string, string>();
    const references: string[] = [];
    const tree = createProcessor({ remarkPlugins: [remarkGfm] }).parse(content);
    const visit = (node: { type: string; url?: string; identifier?: string; name?: string | null; attributes?: Array<{ type: string; name?: string; value?: unknown }>; children?: unknown[] }) => {
      if (node.type === "image" && node.url) urls.add(node.url);
      if (node.type === "definition" && node.url && node.identifier) definitions.set(node.identifier.toLowerCase(), node.url);
      if (node.type === "imageReference" && node.identifier) references.push(node.identifier.toLowerCase());
      if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && (node.name === "Image" || node.name === "img")) {
        const src = node.attributes?.find((attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === "src")?.value;
        if (typeof src === "string") urls.add(src);
      }
      for (const child of node.children ?? []) visit(child as typeof node);
    };
    visit(tree);
    for (const identifier of references) {
      const url = definitions.get(identifier);
      if (url) urls.add(url);
    }
    return [...urls];
  } catch {
    return [];
  }
}
