/** Strips HTML tags and collapses whitespace, for previews and word counts. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Turns a plain-text body into a safe HTML fragment with paragraphs. */
export function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return '';
  return paragraphs.map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`).join('');
}
