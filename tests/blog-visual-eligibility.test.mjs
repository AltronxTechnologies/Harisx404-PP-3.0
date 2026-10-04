import assert from "node:assert/strict";
import test from "node:test";
import { canUseVisualBlogEditor } from "../app/lib/admin/blog-visual-eligibility.ts";

test("visual mode accepts the Markdown features supported by Tiptap", () => {
  for (const source of [
    "# Heading\n\nA paragraph with **bold**, *italic*, and `inline code`.",
    "- First\n- Second\n\n> A quote\n\n---",
    "| Topic | Value |\n| --- | --- |\n| One | Two |",
    "[Read more](/blog/post) and ![A photo](/blog/photo.jpg)",
    "```jsx\n<Ideaquote>Code, not MDX</Ideaquote>\n```",
  ]) assert.equal(canUseVisualBlogEditor(source), true, source);
});

test("visual mode rejects custom MDX and unsupported Markdown without changing source", () => {
  for (const source of [
    "<Ideaquote>Keep this custom component</Ideaquote>",
    "Before <Callout emoji=\"!\">Important</Callout> after",
    "<iframe src=\"https://www.youtube.com/embed/example\" />",
    "<CodePlayground files={{ '/example.js': 'example' }} />",
    'Text with {" "} expression',
    "[Label][reference]\n\n[reference]: /blog/post",
    "import Thing from './thing'",
    "<Unclosed>",
  ]) assert.equal(canUseVisualBlogEditor(source), false, source);
});
