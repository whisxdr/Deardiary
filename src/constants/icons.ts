/** Icon size scale, so every icon in the UI lines up on the same steps. */
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Named icon size, used instead of raw pixel numbers at call sites. */
export type IconSize = keyof typeof ICON_SIZES;
