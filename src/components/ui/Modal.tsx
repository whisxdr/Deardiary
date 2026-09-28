import { X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
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

/** Accessible dialog with fade + slide motion and Escape-to-close. */
export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

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
          <div className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative w-full rounded-lg border border-primary-200 bg-accent-cream p-6 shadow-hard',
              'dark:border-primary-700 dark:bg-primary-800 dark:text-primary-100',
              SIZES[size],
            )}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-primary-800 dark:text-primary-100">{title}</h2>
                {description ? (
                  <p className="mt-1 font-body text-sm text-muted dark:text-primary-300">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
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
