import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Blog source editor keeps Tab navigation and exposes modifier indentation", async () => {
  const source = await readFile(new URL("../app/components/admin/BlogCodeEditor.tsx", import.meta.url), "utf8");
  const keys = source.slice(source.indexOf("const handleKeyDown"), source.indexOf("// 2. Enter auto-indent"));
  assert.doesNotMatch(keys, /e\.key === "Tab"/);
  assert.match(keys, /\(e\.ctrlKey \|\| e\.metaKey\) && \(e\.key === "\]" \|\| e\.key === "\["\)/);
  assert.match(source, /id="blog-mdx-keyboard-hint"/);
  assert.match(source, /aria-describedby=\{\[errorId, "blog-mdx-keyboard-hint"\]/);
});
