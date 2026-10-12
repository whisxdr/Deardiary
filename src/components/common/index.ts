// ConfirmDialog is deliberately not re-exported: it pulls in Modal, and Modal imports
// Framer Motion. A barrel is imported whole, so re-exporting it here put the animation
// library into every page that only wanted EmptyState or IconButton. The pages that
// actually open a dialog import `@/components/common/ConfirmDialog` directly.
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { ErrorBoundary } from './ErrorBoundary';
export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';
