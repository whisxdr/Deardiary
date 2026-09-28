import { Toaster as SonnerToaster, toast } from 'sonner';
import { TIMING } from '@/constants';

/** App-wide toast host; mount once in the provider tree. */
export function ToastHost() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={TIMING.toastDurationMs}
      toastOptions={{
        classNames: {
          toast:
            'font-body text-sm rounded-md border border-primary-200 bg-accent-cream text-primary-800 shadow-hard',
          description: 'text-muted',
          actionButton: 'bg-primary-700 text-accent-cream',
        },
      }}
    />
  );
}

export { toast };
