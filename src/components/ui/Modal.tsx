import { X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible dialog with fade + slide motion, Escape-to-close and a focus trap. */
export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const close = useCallback(() => onClose(), [onClose]);

  // Escape closes this dialog and stops there, so page-level shortcuts that also
  // listen on Escape (the editor's "leave the page") do not fire at the same time.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [close, open]);

  // Move focus into the dialog, keep Tab inside it, restore focus when it closes.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const node = dialogRef.current;
      if (!node) return;
      if (node.contains(document.activeElement)) return;
      (node.querySelector<HTMLElement>(FOCUSABLE) ?? node).focus();
    };
    // Run immediately, then again after paint: the dialog mounts inside
    // AnimatePresence, so the first attempt can land before the node exists.
    focusFirst();
    const timer = window.setTimeout(focusFirst, 60);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Stop the page behind the dialog from scrolling while it is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          <div className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm" onClick={close} aria-hidden="true" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              'relative w-full rounded-lg border border-primary-200 bg-accent-cream p-6 shadow-hard',
              'focus:outline-none dark:border-primary-700 dark:bg-primary-800 dark:text-primary-100',
              SIZES[size],
            )}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-display text-xl text-primary-800 dark:text-primary-100">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 font-body text-sm text-muted dark:text-primary-300">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className="rounded-md p-1 text-muted transition-colors duration-fast hover:bg-primary-100/70"
              >
                <X size={20} weight="regular" aria-hidden="true" />
              </button>
            </div>
            <div className="font-body text-sm text-primary-700 dark:text-primary-200">{children}</div>
            {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
