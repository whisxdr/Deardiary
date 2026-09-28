import { useEffect, useRef } from 'react';

/** Calls `handler` when a click lands outside the referenced element. */
export function useClickOutside<T extends HTMLElement>(handler: () => void, enabled = true) {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element || element.contains(event.target as Node)) return;
      handlerRef.current();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [enabled]);

  return ref;
}
