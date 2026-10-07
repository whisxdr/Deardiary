/** Cuts a string to `max` characters, appending an ellipsis when trimmed. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Lowercase, hyphenated slug safe for filenames and anchors. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Prefixes a number with + or - for stat deltas. */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** Initials used by the avatar fallback, at most two letters. */
export function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'D';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
