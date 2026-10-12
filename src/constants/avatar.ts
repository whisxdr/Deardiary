/** DiceBear style used for user portraits. */
export const AVATAR_STYLE = 'lorelei';

/** DiceBear CDN endpoint for SVG portraits. */
export const AVATAR_API_BASE = 'https://api.dicebear.com/9.x';

export type AvatarGender = 'man' | 'woman';

/**
 * Hairstyles that read as feminine and masculine in the `lorelei` style.
 *
 * DiceBear has no gender switch, so the look is carried by the traits themselves: a long
 * `hair` variant, earrings and a clean jaw for the woman set, a short variant for the man
 * set. The variants were picked by rendering all 48 and choosing by eye.
 */
const WOMAN_HAIR = ['variant15', 'variant16', 'variant24', 'variant30', 'variant40', 'variant48'] as const;
const MAN_HAIR = ['variant01', 'variant03', 'variant07', 'variant08', 'variant27', 'variant29'] as const;

/** Distinct seeds, one per portrait, so no two choices draw the same face. */
const WOMAN_SEEDS = ['willow', 'poppy', 'lilac', 'hazel', 'orchid', 'wren'] as const;
const MAN_SEEDS = ['harbor', 'nightfall', 'thistle', 'rowan', 'sable', 'maple'] as const;

export interface AvatarChoice {
  seed: string;
  gender: AvatarGender;
  /** Pinned hairstyle; keeps a portrait stable when the seed list changes. */
  hair: string;
}

function build(seeds: readonly string[], hair: readonly string[], gender: AvatarGender): AvatarChoice[] {
  return seeds.map((seed, index) => ({ seed, gender, hair: hair[index % hair.length] }));
}

const WOMAN_CHOICES = build(WOMAN_SEEDS, WOMAN_HAIR, 'woman');
const MAN_CHOICES = build(MAN_SEEDS, MAN_HAIR, 'man');

/**
 * Portrait choices offered in Profile settings.
 *
 * The two sets are interleaved, so the single grid alternates between them instead of
 * reading as one block per gender.
 */
export const AVATAR_CHOICES: readonly AvatarChoice[] = WOMAN_CHOICES.flatMap((woman, index) =>
  index < MAN_CHOICES.length ? [woman, MAN_CHOICES[index]] : [woman],
);

/** Default portrait for a fresh install. */
export const DEFAULT_AVATAR = AVATAR_CHOICES[0];

/** Default seed for a fresh install. */
export const DEFAULT_AVATAR_SEED = DEFAULT_AVATAR.seed;

/**
 * Resolves the portrait a seed draws.
 *
 * A seed stored before the portrait sets existed keeps rendering, but its pinned
 * hairstyle is gone with the old style, so it falls back to the man set.
 */
export function choiceForSeed(seed: string): AvatarChoice {
  return AVATAR_CHOICES.find((choice) => choice.seed === seed) ?? { seed, gender: 'man', hair: MAN_HAIR[0] };
}

/** Builds the DiceBear portrait URL for a seed and its presentation. */
export function avatarUrl(seed: string, gender: AvatarGender = 'man', hair: string = MAN_HAIR[0]): string {
  const params = new URLSearchParams({ seed, hair });
  // Earrings and a clean jaw are what read as feminine here; the man set keeps the
  // occasional beard the style draws on its own.
  params.set('beardProbability', gender === 'woman' ? '0' : '15');
  if (gender === 'woman') params.set('earringsProbability', '100');
  return `${AVATAR_API_BASE}/${AVATAR_STYLE}/svg?${params.toString()}`;
}
