import { useEffect, useState } from 'react';

/** Tracks the pointer and returns a small tilt offset for the cover parallax. */
export function useParallax(strength = 6) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * strength;
      const y = (event.clientY / window.innerHeight - 0.5) * -strength;
      setTilt({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [strength]);

  return tilt;
}
