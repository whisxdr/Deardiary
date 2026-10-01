import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Changing this clears the error state.
   *
   * Every route renders its own boundary, but the router reuses the instance when only
   * the path params change, so a crash used to survive Back and leave reload as the only
   * way out. Clearing on a key change instead of remounting the children keeps the page's
   * own state — the reader's flip direction, the dashboard's filters — intact.
   */
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/** Catches render errors so a broken page never blanks the whole app. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  override componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.hasError && previous.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('DearDiary crashed while rendering a page:', error, info.componentStack);
  }

  private readonly handleReload = () => {
    window.location.reload();
  };

  /**
   * Turns a thrown message into something a user can act on.
   *
   * A failed lazy-chunk import surfaces as "Failed to fetch dynamically imported module:
   * http://host/assets/Stats-BQ-q5zTw.js", which is a stack trace, not an explanation. It
   * almost always means the deploy changed while the tab was open, so the file the page
   * wants no longer exists.
   */
  private readonly explain = (message: string): string => {
    if (/dynamically imported module|Loading chunk|Importing a module script failed/i.test(message)) {
      return 'The app was updated while this page was open, so part of it could not be loaded. Reloading will fix it.';
    }
    if (/QuotaExceeded|storage/i.test(message)) {
      return 'This browser refused to store more data. Export a backup, then remove entries you no longer need.';
    }
    return 'Something went wrong while rendering this page.';
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary-50 px-6 text-center">
        <h1 className="font-display text-2xl text-primary-800">This page lost its bookmark</h1>
        <p className="max-w-md font-body text-sm text-muted">
          Something went wrong while rendering. Your entries are still safe in local storage.
        </p>
        <p className="max-w-md font-body text-sm text-primary-600 dark:text-primary-200">{this.explain(this.state.message)}</p>
        <Button onClick={this.handleReload}>Reload the diary</Button>
      </div>
    );
  }
}
