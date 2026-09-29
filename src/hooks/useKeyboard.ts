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
  // Ctrl and Cmd are interchangeable: on macOS Cmd+S sets metaKey rather than ctrlKey,
  // so an exact-match comparison made the shortcut fall through to the browser's own
  // "Save page" dialog.
  const primary = event.ctrlKey || event.metaKey;
  const wantsPrimary = Boolean(binding.ctrl) || Boolean(binding.meta);
  return (
    event.key.toLowerCase() === binding.key.toLowerCase() &&
    primary === wantsPrimary &&
    event.shiftKey === Boolean(binding.shift) &&
    event.altKey === Boolean(binding.alt)
  );
}

/** True when focus sits in a text field, where shortcuts should not hijack typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Registers global keyboard shortcuts for the lifetime of the component.
 *
 * Shortcuts stay quiet while a dialog is open and while the user is typing in a
 * field, so a page-level binding never fights a component that owns the keyboard.
 */
export function useKeyboard(bindings: KeyBinding[], enabled = true): void {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const binding = bindingsRef.current.find((item) => matches(event, item));
      if (!binding) return;
      // Plain-key shortcuts must not fire mid-sentence; modified ones may.
      const hasModifier = binding.ctrl || binding.meta || binding.alt;
      if (!hasModifier && isTypingTarget(event.target)) return;

      event.preventDefault();
      binding.handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
