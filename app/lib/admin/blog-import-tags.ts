export function parseBlogImportTags(frontmatter: string): string[] | null {
  const field = /^tags:[ \t]*([^\r\n]*)/m.exec(frontmatter);
  if (!field) return null;

  const inline = /^\[([^\]\r\n]*)\][ \t]*$/.exec(field[1].trim());
  const block = field[1].trim() === ""
    ? /^tags:[ \t]*[\r\n]+((?:[ \t]*-[ \t]*[^\r\n]+(?:[\r\n]+|$))+)/m.exec(frontmatter)
    : null;
  if (!inline && !block) throw new Error("Tags must be a YAML list or an inline list such as tags: [web, security]. No fields were changed.");

  const items = inline
    ? [...inline[1].matchAll(/(?:^|,)\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^,]+)\s*/g)].map((match) => match[1])
    : [...block![1].matchAll(/^[ \t]*-[ \t]*(.+)$/gm)].map((match) => match[1]);
  const tags = items.map((item) => item.trim().replace(/^(["'])(.*)\1$/, "$2").trim()).filter(Boolean);
  if (tags.length > 10 || tags.some((tag) => tag.length > 50 || !/[\p{L}\p{N}]/u.test(tag))) {
    throw new Error("Choose at most 10 tags, each with a letter or number and no more than 50 characters. No fields were changed.");
  }
  return [...new Set(tags)];
}
