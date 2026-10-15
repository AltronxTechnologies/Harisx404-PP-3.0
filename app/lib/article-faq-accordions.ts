type FaqNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: FaqNode[];
  data?: { hProperties?: Record<string, unknown> };
  [key: string]: unknown;
};

function textOf(node: FaqNode): string {
  return node.value || node.children?.map(textOf).join("") || "";
}

export function articleFaqAccordions(tree: { children: FaqNode[] }) {
  const nodes = tree.children;
  const start = nodes.findIndex((node) => node.type === "heading" && node.depth === 2 && textOf(node).trim() === "Frequently Asked Questions");
  if (start < 0) return;
  const nextSection = nodes.findIndex((node, index) => index > start && node.type === "heading" && (node.depth || 0) <= 2);
  const end = nextSection < 0 ? nodes.length : nextSection;
  const section = nodes.slice(start + 1, end);
  const questions = section.flatMap((node, index) => node.type === "heading" && node.depth === 3 ? [index] : []);
  if (!questions.length) return;

  const accordions = questions.map((at, index) => {
    const heading = section[at];
    const answer = section.slice(at + 1, questions[index + 1] ?? section.length);
    if (!answer.length) return null;
    return {
      type: "mdxJsxFlowElement",
      name: "ArticleFaq",
      attributes: [
        { type: "mdxJsxAttribute", name: "question", value: textOf(heading).trim() },
        { type: "mdxJsxAttribute", name: "anchorId", value: String(heading.data?.hProperties?.id || "") },
      ],
      children: answer,
    };
  });
  if (accordions.some((item) => !item)) return;
  nodes.splice(start + 1, end - start - 1, ...section.slice(0, questions[0]), ...accordions as FaqNode[]);
}

export function articleFaqToc<T extends { level: number; text: string }>(headings: T[]): T[] {
  let inFaq = false;
  return headings.filter((heading) => {
    if (heading.level === 2) inFaq = heading.text === "Frequently Asked Questions";
    return !inFaq || heading.level === 2;
  });
}
