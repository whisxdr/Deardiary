/** DiceBear style used for user portraits. */
export const AVATAR_STYLE = 'lorelei';

/** DiceBear CDN endpoint for SVG portraits. */
export const AVATAR_API_BASE = 'https://api.dicebear.com/9.x';

export type AvatarGender = 'man' | 'woman';

export interface AvatarChoice {
  seed: string;
  gender: AvatarGender;
}

/**
 * Portrait choices offered in Profile settings.
 *
 * The `lorelei` style has no gender option, so each set is expressed through the two
 * features that actually change the drawing: `beardProbability` and `earringsProbability`.
 * Both only gate a feature the seed already derives, so the seeds are chosen rather than
 * styled — every woman seed renders earrings and no beard, every man seed is left at the
 * defaults. Some seeds respond to neither flag and are unusable here.
 *
 * Seeds are not shared between the sets because DiceBear derives every feature from the
 * seed hash; a reused seed would render the same face in both rows.
 */
export const AVATAR_CHOICES: readonly AvatarChoice[] = [
  { seed: 'willow', gender: 'woman' },
  { seed: 'harbor', gender: 'man' },
  { seed: 'poppy', gender: 'woman' },
  { seed: 'nightfall', gender: 'man' },
  { seed: 'lilac', gender: 'woman' },
  { seed: 'thistle', gender: 'man' },
  { seed: 'hazel', gender: 'woman' },
  { seed: 'rowan', gender: 'man' },
  { seed: 'orchid', gender: 'woman' },
  { seed: 'sable', gender: 'man' },
  { seed: 'wren', gender: 'woman' },
  { seed: 'maple', gender: 'man' },
];

/** Default portrait for a fresh install. */
export const DEFAULT_AVATAR: AvatarChoice = AVATAR_CHOICES[0];

/** Default seed for a fresh install. */
export const DEFAULT_AVATAR_SEED = DEFAULT_AVATAR.seed;

/** Resolves the portrait a seed draws; an unknown seed keeps rendering as a man. */
export function choiceForSeed(seed: string): AvatarChoice {
  return AVATAR_CHOICES.find((choice) => choice.seed === seed) ?? { seed, gender: 'man' };
}

/** Builds the DiceBear portrait URL for a seed and its presentation. */
export function avatarUrl(seed: string, gender: AvatarGender = 'man'): string {
  const query = gender === 'woman' ? '&beardProbability=0&earringsProbability=100' : '';
  return `${AVATAR_API_BASE}/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}${query}`;
}
