/** DiceBear style used for user portraits. */
export const AVATAR_STYLE = 'lorelei';

/** DiceBear CDN endpoint for SVG portraits. */
export const AVATAR_API_BASE = 'https://api.dicebear.com/9.x';

/** Seed choices offered in Profile settings. */
export const AVATAR_SEED_CHOICES = [
  'willow',
  'harbor',
  'ember',
  'meadow',
  'lantern',
  'quiet-rain',
  'inkwell',
  'nightfall',
] as const;

/** Default seed for a fresh install. */
export const DEFAULT_AVATAR_SEED = 'willow';

/** Builds the DiceBear portrait URL for a seed. */
export function avatarUrl(seed: string): string {
  return `${AVATAR_API_BASE}/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}
