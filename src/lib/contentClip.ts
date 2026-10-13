import { LIMITS } from '@/constants';

/** An inline image data URL — the only image shape the editor's upload produces. */
const IMAGE_DATA_URL = /data:image\/[a-z+]+;base64,[a-z0-9+/=]+/gi;

/**
 * Removes inline image payloads from a body, leaving the text around them.
 *
 * A base64 payload is not text: one photo runs to hundreds of thousands of characters,
 * so a budget that counts it against the words cuts every uploaded image to a broken
 * fragment on the first save.
 */
export function stripImageDataUrls(html: string): string {
  return html.replace(IMAGE_DATA_URL, '');
}

/**
 * Clips a body to `LIMITS.contentMaxLength` of text without touching its images.
 *
 * Payloads are swapped for a short token, then the text between the tokens is clipped
 * while every token is kept — so the budget applies to the words and a photo survives
 * even when it sits past the budget, which a plain `.slice()` silently cut to a broken
 * fragment. Tokens past the boundary are restored in order after the clipped text.
 */
export function clipContent(html: string): string {
  const payloads: string[] = [];
  const skeleton = html.replace(IMAGE_DATA_URL, (payload) => {
    payloads.push(payload);
    return `\u0000${payloads.length - 1}\u0000`;
  });
  let budget = LIMITS.contentMaxLength;
  let clipped = '';
  let index = 0;
  while (index < skeleton.length) {
    if (skeleton[index] === '\u0000') {
      const end = skeleton.indexOf('\u0000', index + 1);
      clipped += skeleton.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    if (budget > 0) {
      clipped += skeleton[index];
      budget -= 1;
    }
    index += 1;
  }
  return clipped.replace(/\u0000(\d+)\u0000/g, (_match, position: string) => payloads[Number(position)]);
}
