import { LIMITS } from '@/constants';

/** Trims and collapses whitespace in user input. */
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Normalizes a tag: lowercase, no leading hash, whitespace collapsed. */
export function normalizeTag(value: string): string {
  return normalizeText(value.replace(/^#+/, '').toLowerCase()).slice(0, LIMITS.tagMaxLength);
}

/** True when the tag is non-empty after normalization. */
export function isValidTag(value: string): boolean {
  const tag = normalizeTag(value);
  return tag.length > 0 && tag.length <= LIMITS.tagMaxLength;
}

/** Keeps only valid, unique tags, capped at the configured maximum. */
export function sanitizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= LIMITS.maxTags) break;
  }
  return out;
}

/** Clamps a title to the configured maximum length. */
export function sanitizeTitle(value: string): string {
  return normalizeText(value).slice(0, LIMITS.titleMaxLength);
}

/** Trims an ISO date-time string, returning an empty string for invalid input. */
export function sanitizeDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

/** Splits raw input into a tag list, accepting commas, semicolons and newlines. */
export function parseTagInput(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
