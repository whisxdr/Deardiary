/** Square viewBox, so the orbit centre and the SVG centre are the same point. */
export const SIZE = 320;
export const CENTER = SIZE / 2;

export const GOLD = '#C9A961';
export const CREAM = '#F5F0E6';

/** Spikes of the little travelling stars, in viewBox units; orbits scale from this. */
export const SPARKLE_UNIT = 6;

/**
 * Star outline as an SVG path.
 *
 * Walks `points` spikes, alternating the outer and inner radius, so the shape is
 * generated instead of pasted in as a long `d` string. The static shell in index.html
 * carries the same two paths in plain markup, so the first painted frame and this one
 * sit on exactly the same pixels.
 */
function starPath(outer: number, inner: number, points: number): string {
  const step = Math.PI / points;
  let path = '';
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = index * step - Math.PI / 2;
    const x = (Math.cos(angle) * radius).toFixed(2);
    const y = (Math.sin(angle) * radius).toFixed(2);
    path += `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  return `${path}Z`;
}

/** Four-point spikes, plus the same spikes turned 45°: together the vintage 8-point star. */
export const STAR_SPIKES = starPath(46, 13, 4);
export const STAR_CROSS = starPath(33, 9, 4);
export const SPARKLE = starPath(SPARKLE_UNIT, 2, 4);

export interface OrbitStar {
  /** Position on the ring, in degrees. */
  angle: number;
  /** Spike length in viewBox units. */
  size: number;
  /** Twinkle offset, so the stars on one ring do not pulse in step. */
  delay: number;
}

export interface Orbit {
  radius: number;
  dash: string;
  /** `-1` runs the ring backwards, which reads as depth without a second effect. */
  direction: 1 | -1;
  stars: OrbitStar[];
}

export const ORBITS: Orbit[] = [
  {
    radius: 88,
    dash: '3 10',
    direction: 1,
    stars: [
      { angle: 18, size: 7, delay: 0 },
      { angle: 205, size: 5, delay: 1.1 },
    ],
  },
  {
    radius: 126,
    dash: '2 14',
    direction: -1,
    stars: [
      { angle: 96, size: 6, delay: 0.6 },
      { angle: 292, size: 4.5, delay: 1.7 },
    ],
  },
];
