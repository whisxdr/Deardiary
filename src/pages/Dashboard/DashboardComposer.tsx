import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

/**
 * The composer is only ever opened by a click, and it carries Framer Motion through
 * `Modal`. Loading it on that click keeps the animation library off the dashboard's first
 * paint, which is the route every visitor lands on.
 */
const ComposerModal = lazy(() =>
  import('@/components/layout/ComposerModal').then((module) => ({ default: module.ComposerModal })),
);

export interface DashboardComposerProps {
  /** Mounted only while open, so the lazy chunk is requested on the first click. */
  open: boolean;
  onClose: () => void;
}

/** Lazily mounts the template composer and carries the chosen template into the editor. */
export function DashboardComposer({ open, onClose }: DashboardComposerProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <ComposerModal
        open
        onClose={onClose}
        onSelect={(templateId, backdated) => {
          onClose();
          const params = new URLSearchParams({ template: templateId });
          if (backdated) params.set('backdated', 'true');
          navigate(`${ROUTES.write}?${params.toString()}`);
        }}
      />
    </Suspense>
  );
}
