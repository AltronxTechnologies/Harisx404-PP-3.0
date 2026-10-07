import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const window = new Window({ url: "https://example.com" });
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  Node: window.Node,
  MutationObserver: window.MutationObserver,
  getSelection: window.getSelection.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test("Blog link URL validation accepts only HTTP(S) and safe relative destinations", async () => {
  const { validBlogLinkUrl } = await import("../app/components/admin/TiptapEditor");
  for (const value of ["https://example.com/post?q=1", "http://example.com", "/blog/post", "../post", "./post", "#heading", "?page=2"]) {
    assert.equal(validBlogLinkUrl(value), true, value);
  }
  for (const value of ["", "  ", "//evil.test", "javascript:alert(1)", "data:text/html,hi", "ftp://example.com", "https://user:pass@example.com", "https://example.com/a b", "/bad\\path", "/<script>", "https://example.com/\"bad", "https://", "\nhttps://example.com"]) {
    assert.equal(validBlogLinkUrl(value), false, value);
  }
});

test("Blog heading, rule, link insertion, edit and removal survive Markdown serialization and reload", async () => {
  const [{ Editor }, { default: StarterKit }, { Markdown }] = await Promise.all([
    import("@tiptap/core"), import("@tiptap/starter-kit"), import("tiptap-markdown"),
  ]);
  const createEditor = (content: string) => new Editor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Markdown],
    content,
  });
  const getMarkdown = (instance: InstanceType<typeof Editor>) =>
    (instance.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
  const editor = createEditor("A post");
  try {
    editor.chain().focus().setTextSelection(1).toggleHeading({ level: 3 }).run();
    editor.chain().focus().setTextSelection(7).setHorizontalRule().run();
    editor.chain().focus().insertContent({ type: "text", text: "Read more", marks: [{ type: "link", attrs: { href: "/blog/post" } }] }).run();
    let markdown = getMarkdown(editor);
    assert.match(markdown, /^### A post/m);
    assert.match(markdown, /\n---\n/);
    assert.match(markdown, /\[Read more\]\(\/blog\/post\)/);

    const reloaded = createEditor(markdown);
    try {
      assert.equal(getMarkdown(reloaded), markdown);
      reloaded.commands.setTextSelection(reloaded.state.doc.content.size - 2);
      reloaded.chain().focus().extendMarkRange("link").setLink({ href: "https://example.com/new" }).run();
      markdown = getMarkdown(reloaded);
      assert.match(markdown, /\[Read more\]\(https:\/\/example.com\/new\)/);
      reloaded.chain().focus().extendMarkRange("link").unsetLink().run();
      assert.doesNotMatch(getMarkdown(reloaded), /\[Read more\]/);
    } finally {
      reloaded.destroy();
    }
  } finally {
    editor.destroy();
  }
});

test("Blog image alt and caption survive Markdown serialization and reload", async () => {
  const [{ Editor }, { default: StarterKit }, { Markdown }, { Image }] = await Promise.all([
    import("@tiptap/core"), import("@tiptap/starter-kit"), import("tiptap-markdown"), import("@tiptap/extension-image"),
  ]);
  const createEditor = (content: string) => new Editor({ extensions: [StarterKit, Image, Markdown], content });
  const editor = createEditor("Before");
  try {
    editor.chain().focus().setImage({ src: "https://example.com/photo.jpg", alt: "A cat", title: "Cat sitting" }).run();
    const markdown = (editor.storage as any).markdown.getMarkdown();
    assert.match(markdown, /!\[A cat\]\(https:\/\/example.com\/photo.jpg "Cat sitting"\)/);
    const reloaded = createEditor(markdown);
    try {
      assert.equal((reloaded.storage as any).markdown.getMarkdown(), markdown);
      assert.deepEqual(reloaded.getJSON().content?.find((node) => node.type === "image")?.attrs?.alt, "A cat");
    } finally {
      reloaded.destroy();
    }
    editor.commands.setContent("Before");
    editor.chain().focus().setImage({ src: "/blog/photo.jpg", alt: "A cat (sleeping)", title: 'Cat "sitting"' }).run();
    const escaped = (editor.storage as any).markdown.getMarkdown();
    const escapedReloaded = createEditor(escaped);
    try {
      assert.equal(escapedReloaded.getJSON().content?.find((node) => node.type === "image")?.attrs?.alt, "A cat (sleeping)");
      assert.equal(escapedReloaded.getJSON().content?.find((node) => node.type === "image")?.attrs?.title, 'Cat "sitting"');
    } finally {
      escapedReloaded.destroy();
    }
  } finally {
    editor.destroy();
  }
});

test("Blog 2 by 2 table edits round-trip as GFM rendered by the public parser", async () => {
  const [{ Editor }, { default: StarterKit }, { TableKit }, { Markdown }, { evaluate }, { default: remarkGfm }, runtime, React, { renderToStaticMarkup }] = await Promise.all([
    import("@tiptap/core"), import("@tiptap/starter-kit"), import("@tiptap/extension-table"), import("tiptap-markdown"),
    import("@mdx-js/mdx"), import("remark-gfm"), import("react/jsx-runtime"), import("react"), import("react-dom/server"),
  ]);
  const createEditor = (content: string) => new Editor({ extensions: [StarterKit, TableKit, Markdown], content });
  const getMarkdown = (instance: InstanceType<typeof Editor>) =>
    (instance.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
  const editor = createEditor("Before");
  try {
    assert.equal(editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true }), true);
    assert.equal(editor.isActive("table"), true, JSON.stringify(editor.state.selection.toJSON()));
    const cells: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "tableCell" || node.type.name === "tableHeader") cells.push(pos + 2);
    });
    assert.equal(cells.length, 4);
    for (let i = cells.length - 1; i >= 0; i--) {
      editor.chain().focus().setTextSelection(cells[i]).insertContent(["Topic", "Detail", "One", "Two"][i]).run();
    }
    const markdown = getMarkdown(editor);
    assert.match(markdown, /\| Topic\s+\| Detail\s+\|/);
    assert.match(markdown, /\|\s*:?-{3,}:?\s*\|\s*:?-{3,}:?\s*\|/);
    assert.match(markdown, /\| One\s+\| Two\s+\|/);
    const reloaded = createEditor(markdown);
    try {
      assert.equal(getMarkdown(reloaded), markdown, JSON.stringify(reloaded.getJSON()));
      const table = reloaded.getJSON().content?.find((node) => node.type === "table");
      assert.equal(table?.content?.length, 2);
      assert.equal((table as { content: { content: unknown[] }[] }).content[0].content.length, 2);

      const cellPosition = (empty: boolean) => {
        let position = -1;
        reloaded.state.doc.descendants((node, pos) => {
          if (node.type.name === "tableCell" && (node.textContent === "") === empty && position < 0) position = pos + 2;
        });
        assert.ok(position > 0);
        return position;
      };
      reloaded.commands.setTextSelection(cellPosition(false));
      assert.equal(reloaded.commands.addRowAfter(), true);
      assert.equal(reloaded.getJSON().content?.find((node) => node.type === "table")?.content?.length, 3);
      reloaded.commands.setTextSelection(cellPosition(true));
      assert.equal(reloaded.commands.deleteRow(), true);
      reloaded.commands.setTextSelection(cellPosition(false));
      assert.equal(reloaded.commands.addColumnAfter(), true);
      assert.equal((reloaded.getJSON().content?.find((node) => node.type === "table") as { content: { content: unknown[] }[] }).content[0].content.length, 3);
      reloaded.commands.setTextSelection(cellPosition(true));
      assert.equal(reloaded.commands.deleteColumn(), true);
      assert.equal(getMarkdown(reloaded), markdown);
      assert.equal(reloaded.commands.deleteTable(), true);
      assert.equal(reloaded.getJSON().content?.some((node) => node.type === "table"), false);
    } finally {
      reloaded.destroy();
    }

    const { default: Content } = await evaluate(markdown, { ...runtime, remarkPlugins: [remarkGfm] });
    const html = renderToStaticMarkup(React.createElement(Content));
    assert.match(html, /<table>/);
    assert.match(html, /<th>Topic<\/th>/);
    assert.match(html, /<td>Two<\/td>/);
  } finally {
    editor.destroy();
  }
});

test("Blog-only toolbar controls do not appear in Project/Changelog editors", async () => {
  const React = await import("react");
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ createRoot }, { act }, { TiptapEditor }] = await Promise.all([
    import("react-dom/client"), import("react-dom/test-utils"),
    import("../app/components/admin/TiptapEditor"),
  ]);
  const host = document.createElement("div");
  document.body.append(host);
  let root = createRoot(host);
  try {
    await act(async () => root.render(React.createElement(TiptapEditor, { value: "Example", onChange: () => {} })));
    for (const label of ["Heading 3", "Horizontal rule", "Insert or edit link", "Insert image", "Insert 2 by 2 table", "Add row below", "Delete table"]) {
      assert.equal(host.querySelector(`[aria-label="${label}"]`), null, label);
    }
    assert.ok(host.querySelector('[aria-label="Heading 2"]'));

    await act(async () => root.unmount());
    root = createRoot(host);
    const changes: string[] = [];
    await act(async () => root.render(React.createElement(TiptapEditor, { value: "Example", onChange: (value) => changes.push(value), blogTools: true })));
    for (const label of ["Heading 3", "Horizontal rule", "Insert or edit link", "Insert image", "Insert 2 by 2 table"]) {
      assert.ok(host.querySelector(`[aria-label="${label}"]`), label);
    }
    await act(async () => root.render(React.createElement(TiptapEditor, { value: "Example\n\nAdditional body", onChange: (value) => changes.push(value), blogTools: true })));
    assert.equal(changes.length, 0, "loading existing Markdown should not mark content as edited");
    assert.equal(host.querySelector('[role="group"][aria-label="Edit table"]'), null);
    const insertTable = host.querySelector<HTMLButtonElement>('[aria-label="Insert 2 by 2 table"]')!;
    assert.equal(insertTable.type, "button");
    insertTable.focus();
    assert.equal(document.activeElement, insertTable);
    await act(async () => insertTable.click());
    assert.ok(changes.some((value) => /\|\s*:?-{3,}:?\s*\|/.test(value)));
    for (const label of ["Add row below", "Delete row", "Add column to right", "Delete column", "Delete table"]) {
      assert.ok(host.querySelector(`[aria-label="${label}"]`), label);
    }
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Add row below"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Delete row"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Add column to right"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Delete column"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Delete table"]')!.click());
    assert.equal(host.querySelector('[role="group"][aria-label="Edit table"]'), null);
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Insert or edit link"]')!.click());
    assert.ok(host.querySelector('[role="group"][aria-label="Edit link"]'));
    assert.ok(host.querySelector('input[placeholder="https://example.com or /blog/post"]'));
    await act(async () => host.querySelector<HTMLButtonElement>('[role="group"][aria-label="Edit link"] button')!.click());
    assert.match(host.querySelector('[role="alert"]')?.textContent || "", /valid HTTP\(S\) or relative URL/);
    assert.equal(host.querySelector('input[aria-invalid="true"]') !== null, true);
    const setInput = async (input: HTMLInputElement, value: string) => {
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!.call(input, value);
        input.dispatchEvent(new window.Event("input", { bubbles: true }) as unknown as Event);
      });
    };
    await setInput(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Edit link"] input')!, "More");
    await setInput(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Edit link"] input[placeholder]')!, "/blog/post");
    await act(async () => host.querySelector<HTMLButtonElement>('[role="group"][aria-label="Edit link"] button')!.click());
    assert.ok(changes.some((value) => value.includes("[More](/blog/post)")));
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Insert or edit link"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[role="group"][aria-label="Edit link"] button:last-of-type')!.click());
    assert.equal(host.querySelector('[role="group"][aria-label="Edit link"]'), null);
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ data: [{ id: "photo", url: "/blog/photo.jpg", secure_url: "/blog/photo.jpg", alt_text: "IMG_1234.png" }], count: 1 });
    try {
      await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Insert image"]')!.click());
      assert.ok(document.querySelector('[role="dialog"][aria-label="Choose an image"]'));
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      const option = document.querySelector<HTMLButtonElement>('[aria-label="IMG_1234.png"]');
      assert.ok(option, "the media option should render after its read completes");
      await act(async () => option.click());
      await act(async () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Select Image")!.click());
       assert.ok(host.querySelector('[role="group"][aria-label="Image details"]'));
       assert.equal(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Image details"] input')!.value, "");
       assert.equal(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Image details"] input')!.required, false);
       assert.equal(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Image details"] input')!.getAttribute("aria-required"), "true");
      assert.equal(host.querySelector<HTMLButtonElement>('[role="group"][aria-label="Image details"] button')!.disabled, true);
      await setInput(host.querySelector<HTMLInputElement>('[role="group"][aria-label="Image details"] input')!, "A photo");
      await setInput(host.querySelectorAll<HTMLInputElement>('[role="group"][aria-label="Image details"] input')[1], "Photo caption");
      await act(async () => host.querySelector<HTMLButtonElement>('[role="group"][aria-label="Image details"] button')!.click());
      assert.ok(changes.some((value) => value.includes('![A photo](/blog/photo.jpg "Photo caption")')), JSON.stringify(changes));
    } finally {
      globalThis.fetch = previousFetch;
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
