import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

export interface StatNumberProps {
  value: number;
  durationMs?: number;
  suffix?: string;
}

/**
 * Counts up to the target number on mount.
 *
 * Progress is derived from elapsed time rather than tick count, so a throttled or
 * backgrounded tab still lands on the final value instead of freezing part way.
 */
export function StatNumber({ value, durationMs = 700, suffix = '' }: StatNumberProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (reducedMotion || value === 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(value * progress));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [durationMs, reducedMotion, value]);

  return <span>{`${display.toLocaleString('en-US')}${suffix}`}</span>;
}
