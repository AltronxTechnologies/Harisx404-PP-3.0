import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const jsxAttributes = {
  Ideaquote: [], Thoughtquote: [], Warningquote: [], Infoquote: [], Announcementquote: [],
  Callout: ["emoji"], CodePlayground: ["files", "template", "showPreview", "editorHeight", "previewHeight"],
  iframe: ["src", "title", "height", "width", "scrolling", "frameBorder", "loading", "allowtransparency", "allowransparency", "allow", "allowFullScreen", "className"],
  a: ["href", "title", "target", "rel", "className"],
  img: ["src", "alt", "title", "width", "height", "className", "align"],
  Image: ["src", "alt", "title", "width", "height", "className"],
  blockquote: ["cite"],
};

export class BlogMdxValidationError extends Error {}

function fail(node, reason) {
  throw new BlogMdxValidationError(`Blog MDX line ${node.position?.start?.line ?? "?"}: ${reason}`);
}

function staticExpression(program) {
  if (program?.type !== "Program" || program.body?.length !== 1 || program.body[0].type !== "ExpressionStatement") return null;
  return program.body[0].expression ?? null;
}

function isLiteral(expression, value) {
  return expression?.type === "Literal" && (arguments.length < 2 || expression.value === value);
}

function isStaticFiles(expression) {
  return expression?.type === "ObjectExpression" && !!expression.properties?.length && expression.properties.every((property) =>
    property.type === "Property" && property.kind === "init" && !property.computed && !property.shorthand && !property.method &&
    isLiteral(property.key ?? null) && typeof property.key?.value === "string" && /^\/(?!\/)/.test(property.key.value) &&
    (isLiteral(property.value) && typeof property.value?.value === "string" ||
      property.value?.type === "TemplateLiteral" && property.value.expressions?.length === 0 && property.value.quasis?.length === 1),
  );
}

function safeUrl(value, kind) {
  if (/[\u0000-\u001f\u007f\\<>"']/.test(value) || value.startsWith("//")) return false;
  if (kind !== "iframe") {
    if (kind === "link" && /^mailto:/i.test(value)) return true;
    if (!/^[a-z][a-z\d+.-]*:/i.test(value)) {
      return /^(\/|#|\?|\.\.?\/|[a-z\d_-])/i.test(value);
    }
  }
  try {
    const url = new URL(value);
    if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) return false;
    if (kind === "iframe") return url.protocol === "https:" && ["codepen.io", "www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(url.hostname);
    return true;
  } catch {
    return false;
  }
}

export function validateBlogMdx(source) {
  let tree;
  try {
    tree = createProcessor({ remarkPlugins: [remarkGfm] }).parse(source);
  } catch (error) {
    throw new BlogMdxValidationError(`Invalid Blog MDX: ${error instanceof Error ? error.message : "parse failed"}`);
  }
  const definitions = new Map();
  const imageReferences = [];

  function visit(node) {
    if (node.type === "html") fail(node, "raw HTML is not allowed");
    if (node.type === "mdxjsEsm") fail(node, "imports and exports are not allowed");
    if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
      if (!isLiteral(staticExpression(node.data?.estree), " ")) fail(node, "only a literal space expression is allowed");
    }
    if (["link", "definition", "image"].includes(node.type ?? "")) {
      if (!node.url || !safeUrl(node.url, node.type === "image" ? "image" : "link")) fail(node, "unsafe Markdown URL");
    }
    if (node.type === "definition") definitions.set(node.identifier.toLowerCase(), node.url);
    if (node.type === "imageReference") imageReferences.push(node);
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      const name = node.name ?? "";
      if (!Object.hasOwn(jsxAttributes, name)) fail(node, `unsupported JSX element <${name}>`);
      const seen = new Set();
      for (const attribute of node.attributes ?? []) {
        const key = attribute.name ?? "";
        if (attribute.type !== "mdxJsxAttribute" || !jsxAttributes[name].includes(key) || /^on[A-Z]/i.test(key) || seen.has(key)) fail(node, `unsupported attribute on <${name}>`);
        seen.add(key);
        const expression = typeof attribute.value === "object" && attribute.value !== null ? staticExpression(attribute.value.data?.estree) : null;
        if (typeof attribute.value === "object" && attribute.value !== null && !(
          name === "CodePlayground" && key === "files" && isStaticFiles(expression) ||
          name === "iframe" && key === "allowFullScreen" && isLiteral(expression, true)
        )) fail(node, `dynamic attribute ${key} is not allowed`);
        if (key === "files" && typeof attribute.value !== "object") fail(node, "files must be a static object");
        if (["href", "src"].includes(key) && (typeof attribute.value !== "string" || !safeUrl(attribute.value, name === "iframe" ? "iframe" : key === "src" ? "image" : "link"))) fail(node, `unsafe ${key} URL`);
      }
      if (name === "iframe" && !seen.has("src")) fail(node, "iframe src is required");
      if (name === "CodePlayground" && !seen.has("files")) fail(node, "CodePlayground files are required");
    }
    for (const child of node.children ?? []) visit(child);
  }

  visit(tree);
  for (const reference of imageReferences) {
    const url = definitions.get(reference.identifier.toLowerCase());
    if (url && !safeUrl(url, "image")) fail(reference, "unsafe Markdown image URL");
  }
}
