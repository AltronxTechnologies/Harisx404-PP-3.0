import assert from "node:assert/strict";
import test from "node:test";
import { articleFaqAccordions, articleFaqToc } from "../app/lib/article-faq-accordions";

const heading = (depth: number, text: string, id?: string) => ({
  type: "heading", depth, children: [{ type: "text", value: text }],
  data: { hProperties: { id } },
});
const paragraph = (text: string) => ({ type: "paragraph", children: [{ type: "text", value: text }] });

test("FAQ nodes become accordions while retaining IDs, answers and later headings", () => {
  const tree: any = { children: [
    heading(2, "Key takeaways"), paragraph("The earlier article remains unchanged."),
    heading(2, "Frequently Asked Questions", "frequently-asked-questions"),
    heading(3, "Is RAG the same as fine-tuning?", "is-rag-the-same-as-fine-tuning"),
    paragraph("RAG supplies knowledge at question time."),
    heading(3, "Does RAG eliminate hallucinations?", "does-rag-eliminate-hallucinations"),
    paragraph("No; verify the answer against sources."),
    heading(2, "References", "references"), paragraph("References remain readable."),
  ] };
  articleFaqAccordions(tree);
  const items = tree.children.filter((node: any) => node.name === "ArticleFaq");
  assert.equal(items.length, 2);
  assert.equal(items[0].attributes[0].value, "Is RAG the same as fine-tuning?");
  assert.equal(items[0].attributes[1].value, "is-rag-the-same-as-fine-tuning");
  assert.match(JSON.stringify(items[0].children), /RAG supplies knowledge at question time/);
  assert.ok(tree.children.some((node: any) => node.type === "heading" && node.children[0]?.value === "References"));
  const toc = articleFaqToc([
    { level: 2, text: "Key takeaways" }, { level: 2, text: "Frequently Asked Questions" },
    { level: 3, text: "Is RAG the same as fine-tuning?" }, { level: 2, text: "References" },
  ]);
  assert.deepEqual(toc.map((item) => item.text), ["Key takeaways", "Frequently Asked Questions", "References"]);
});

test("unrelated, incomplete, and malformed FAQ sections remain unchanged", () => {
  const trees: any[] = [
    { children: [heading(2, "Ordinary questions"), heading(3, "Why?"), paragraph("Answer.")] },
    { children: [heading(2, "Frequently Asked Questions"), heading(3, "Question without answer?")] },
  ];
  for (const tree of trees) {
    const original = JSON.stringify(tree);
    articleFaqAccordions(tree);
    assert.equal(JSON.stringify(tree), original);
  }
  const withoutQuestionMark: any = { children: [heading(2, "Frequently Asked Questions"), heading(3, "Where to start"), paragraph("Begin here.")] };
  articleFaqAccordions(withoutQuestionMark);
  assert.equal(withoutQuestionMark.children[1].name, "ArticleFaq");
});
