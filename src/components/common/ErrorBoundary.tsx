import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
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

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('DearDiary crashed while rendering a page:', error, info.componentStack);
  }

  private readonly handleReload = () => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary-50 px-6 text-center">
        <h1 className="font-display text-2xl text-primary-800">This page lost its bookmark</h1>
        <p className="max-w-md font-body text-sm text-muted">
          Something went wrong while rendering. Your entries are still safe in local storage.
        </p>
        <p className="font-mono text-xs text-muted">{this.state.message}</p>
        <Button onClick={this.handleReload}>Reload the diary</Button>
      </div>
    );
  }
}
