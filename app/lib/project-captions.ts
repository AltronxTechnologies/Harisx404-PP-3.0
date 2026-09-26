export function captionWordCount(caption: string): number {
  const text = caption.trim();
  return text ? text.split(/\s+/u).length : 0;
}
