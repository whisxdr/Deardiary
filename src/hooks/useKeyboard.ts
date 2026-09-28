import { useEffect, useRef } from 'react';

/** Key combo description, e.g. `{ key: 's', ctrl: true }`. */
export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
}

/** True when the keyboard event matches the binding, ignoring modifier order. */
function matches(event: KeyboardEvent, binding: KeyBinding): boolean {
  const key = event.key.toLowerCase();
  return (
    key === binding.key.toLowerCase() &&
    event.ctrlKey === Boolean(binding.ctrl) &&
    event.shiftKey === Boolean(binding.shift) &&
    event.altKey === Boolean(binding.alt) &&
    event.metaKey === Boolean(binding.meta)
  );
}

/** Registers global keyboard shortcuts for the lifetime of the component. */
export function useKeyboard(bindings: KeyBinding[], enabled = true): void {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const binding = bindingsRef.current.find((item) => matches(event, item));
      if (!binding) return;
      event.preventDefault();
      binding.handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
