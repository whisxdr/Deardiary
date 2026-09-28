/** Shared props for the custom SVG mood icons. */
export interface IconProps {
  /** Square pixel size; the icon is always drawn on a 24x24 viewBox. */
  size?: number;
  className?: string;
  /** Stroke color. Defaults to `currentColor` so parents can theme it. */
  color?: string;
}
