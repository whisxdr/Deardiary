/**
 * Plain text of an HTML body, safe to place in JSON or filenames.
 *
 * Block boundaries become newlines before the tags are stripped: `stripHtml` collapses all
 * whitespace, which would flatten a whole entry onto one line.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-3]|blockquote|div)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    // Decode after tags are gone, so an escaped `&lt;3` exports as `<3` rather than
    // staying literal while a real tag was already stripped.
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Converts an HTML body to a Markdown-ish plain text export. */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n')
    .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gis, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gis, '_$2_')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    // Decode after tags are gone, so an escaped `&lt;3` exports as `<3` rather than
    // staying literal while a real tag was already stripped.
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
