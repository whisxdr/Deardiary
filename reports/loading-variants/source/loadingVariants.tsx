import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { cn } from '@/utils';

/**
 * Dev-only comparison page for the three candidate loading illustrations.
 *
 * This exists so the three variants can be judged side by side — at the two real call-site
 * sizes (220 for the route fallback, 200 for the reader) on both the light and the dark
 * fallback backgrounds. It is registered by the router under `import.meta.env.DEV` only and
 * is removed once a winner is integrated.
 *
 * Each variant loads lazily inside its own boundary, so a variant that has not been written
 * yet (or that fails to render) shows a "not built yet" card instead of taking the page down.
 */

const VARIANTS = [
  {
    id: 'paperStack',
    title: 'A — Layered Paper Stack',
    direction: 'Depth via stacked layers. The top sheet of the right stack lifts, sweeps across the spine and lands on the left stack, while a gold ribbon bookmark sways against the travel.',
    Component: lazy(() =>
      import('./variants/paperStack/PaperStackLoader').then((m) => ({ default: m.PaperStackLoader })),
    ),
  },
  {
    id: 'inkedSpread',
    title: 'B — Hand-inked Spread',
    direction: 'The page swipes while it is being written. A quill sweep reveals a squiggle line, then the right page carries across the gutter to reveal a fresh one.',
    Component: lazy(() =>
      import('./variants/inkedSpread/InkedSpreadLoader').then((m) => ({ default: m.InkedSpreadLoader })),
    ),
  },
  {
    id: 'leatherCover',
    title: 'C — Warm Leather Cover',
    direction: 'The cover opens as the reveal. A stitched leather front cover swipes open in 2D to show the cream page stack beneath, over a soft warm vignette.',
    Component: lazy(() =>
      import('./variants/leatherCover/LeatherCoverLoader').then((m) => ({ default: m.LeatherCoverLoader })),
    ),
  },
] as const;

/** The two sizes the real call sites use, so the comparison is judged at production scale. */
const SIZES = [220, 200] as const;

/** Local to this page: shows a card-level message instead of the app's full-page crash screen. */
class CardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[loading-variants] card failed to render:', error.message, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-primary-300 px-4 text-center font-body text-xs text-primary-500 dark:border-primary-600 dark:text-primary-300">
          This variant could not be rendered — check the console for the module error.
        </div>
      );
    }
    return this.props.children;
  }
}

function VariantCard({ variant }: { variant: (typeof VARIANTS)[number] }) {
  const { Component } = variant;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-primary-200/70 bg-white p-5 shadow-soft dark:border-primary-700 dark:bg-primary-800">
      <header className="space-y-1">
        <h2 className="font-display text-lg text-primary-800 dark:text-primary-100">{variant.title}</h2>
        <p className="font-body text-xs leading-relaxed text-muted">{variant.direction}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['light', 'dark'] as const).map((theme) => (
          <div
            key={theme}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg p-3',
              theme === 'light'
                ? 'bg-primary-50 text-primary-600'
                : 'bg-primary-900 text-primary-200',
            )}
          >
            <CardBoundary>
              <Suspense
                fallback={
                  <div className="flex h-[165px] w-[220px] items-center justify-center font-body text-[11px] opacity-60">
                    building…
                  </div>
                }
              >
                <Component size={220} />
              </Suspense>
            </CardBoundary>
            <span className="font-body text-[10px] uppercase tracking-[0.18em] opacity-70">
              {theme === 'light' ? 'Light fallback' : 'Night fallback'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-center gap-6 rounded-lg border border-primary-200/60 bg-primary-50/60 px-3 py-4 dark:border-primary-700 dark:bg-primary-900/40">
        {SIZES.map((size) => (
          <CardBoundary key={size}>
            <Suspense fallback={<div style={{ width: size, height: size * 0.75 }} />}>
              <Component size={size} />
            </Suspense>
          </CardBoundary>
        ))}
      </div>

      <p className="text-center font-body text-[10px] uppercase tracking-[0.18em] text-faint">
        220px route fallback · 200px reader · 176px small
      </p>
    </section>
  );
}

/**
 * Side-by-side comparison of the three loading candidates. Dev-only: the router mounts this
 * route under `import.meta.env.DEV`, and the app shell hides the opening splash on this path.
 */
export function LoadingVariantsPreview() {
  return (
    <main className="min-h-screen bg-primary-100 px-6 py-10 dark:bg-primary-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="font-body text-xs uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
            DearDiary · loading screen study
          </p>
          <h1 className="font-display text-3xl text-primary-800 dark:text-primary-50">
            Three 2D book page-turn candidates
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-muted">
            Each variant is a CSS + SVG loop of about 1.2s that animates transform and opacity
            only, so the route fallback stays free of the animation library. Pick the one whose
            swipe reads best — the winner is then integrated into the real fallback and reader
            loading states.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {VARIANTS.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default LoadingVariantsPreview;
