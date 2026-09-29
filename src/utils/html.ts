/** Named entities the editor can emit, decoded for text exports and previews. */
const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** Decodes the entities above; anything unknown is left as written. */
function decodeEntities(value: string): string {
  return value.replace(/&(?:nbsp|amp|lt|gt|quot|#39|apos);/g, (entity) => ENTITIES[entity] ?? entity);
}

/** Strips HTML tags and collapses whitespace, for previews and word counts. */
export function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
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
