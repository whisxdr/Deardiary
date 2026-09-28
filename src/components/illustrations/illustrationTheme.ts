/** Shared props for the hand-built unDraw-style illustrations. */
export interface IllustrationProps {
  /** Rendered width in pixels; height follows the illustration's aspect ratio. */
  size?: number;
  className?: string;
}

/** Theme colors used by every illustration, so they match the book palette. */
export const ILLUSTRATION_COLORS = {
  /** Primary shape: leather brown. */
  leather: '#7D5A3C',
  /** Darker outline and detail strokes. */
  ink: '#3E2723',
  /** Gold accent for small highlights. */
  gold: '#C9A961',
  /** Background shapes. */
  cream: '#F5F0E6',
  /** Paper-white fills. */
  paper: '#FAF6F0',
} as const;

/** Default stroke settings shared by the illustrations. */
export const ILLUSTRATION_STROKE = {
  width: 2,
  linecap: 'round' as const,
  linejoin: 'round' as const,
};
