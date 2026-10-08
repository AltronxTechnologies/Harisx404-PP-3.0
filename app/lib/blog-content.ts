export function stripRepeatedBlogHeading(content: string, title: string) {
  const body = content.trimStart();
  const firstHeading = /^# ([^\r\n]+)(?:\r?\n)+/.exec(body);
  return firstHeading?.[1].trim() === title.trim() ? body.slice(firstHeading[0].length) : content;
}
