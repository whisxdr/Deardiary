import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common';
import { Loading } from '@/components/illustrations';
import { APP_CONFIG, READER_PATTERN, ROUTES, WRITE_ENTRY_PATTERN } from '@/constants';

const Landing = lazy(() => import('@/pages/Landing/Landing'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const Write = lazy(() => import('@/pages/Write/WriteRoute'));
const Reader = lazy(() => import('@/pages/Reader/Reader'));
const Calendar = lazy(() => import('@/pages/Calendar/Calendar'));
const Stats = lazy(() => import('@/pages/Stats/Stats'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFound'));

/** Full-screen fallback shown while a route chunk loads. */
function RouteFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary-50 dark:bg-primary-900">
      <Loading size={220} />
      <p className="font-body text-sm text-primary-500 dark:text-primary-300">Opening your book</p>
    </div>
  );
}

/** Page names for the document title, keyed by the exact route path. */
const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Entries',
  [ROUTES.calendar]: 'Calendar',
  [ROUTES.stats]: 'Stats',
  [ROUTES.settings]: 'Settings',
  [ROUTES.write]: 'New entry',
};

/** `/entry/` and `/write/`, derived from the patterns so a route rename stays in one place. */
const READER_PREFIX = READER_PATTERN.replace(':id', '');
const WRITE_ENTRY_PREFIX = WRITE_ENTRY_PATTERN.replace(':id', '');

/**
 * Document title for a pathname, or `null` for routes that own their title.
 *
 * The reader builds its title from the entry's own name, so it is left alone here.
 */
function documentTitle(pathname: string): string | null {
  if (pathname.startsWith(READER_PREFIX)) return null;
  if (pathname === ROUTES.landing) return `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`;
  if (pathname.startsWith(WRITE_ENTRY_PREFIX)) return `Edit entry — ${APP_CONFIG.name}`;
  const page = PAGE_TITLES[pathname];
  return page ? `${page} — ${APP_CONFIG.name}` : `Page not found — ${APP_CONFIG.name}`;
}

/**
 * Pathname whose content has already received focus, or `null` before the first render.
 *
 * Module scope rather than a ref: a lazy route chunk suspends this boundary while the
 * fallback shows, so a per-instance ref would forget that the previous route was handled
 * and skip the focus move on the route that actually needed it.
 */
let focusedPath: string | null = null;

/**
 * Clears a crashed page's error state on navigation.
 *
 * All routes share one ErrorBoundary instance, so without this the crash fallback
 * survived Back/Forward and the only way out was a reload. `location.key` changes per
 * history entry; it is passed as `resetKey` rather than as a React `key` so the boundary
 * resets without remounting the page, which would drop the reader's flip direction and
 * the dashboard's filters on every navigation.
 *
 * It also owns the per-route document title and moves focus to the main landmark, so a
 * route change is announced instead of leaving focus on `<body>`. Both are keyed on the
 * pathname: the header search box rewrites the query string on every keystroke, and
 * focusing the page mid-typing would take the caret away.
 */
function RouteBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    const title = documentTitle(pathname);
    if (title) document.title = title;

    // The first render is not a navigation: focus stays where the browser put it, so the
    // header and the skip link are still the first tab stops on a fresh load.
    const previous = focusedPath;
    focusedPath = pathname;
    if (previous === null || previous === pathname) return;

    const main = document.getElementById('main-content');
    // `preventScroll` keeps the reader's arrow-key page turns from jumping to the top;
    // the focus move is for the announcement, not for scrolling.
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [pathname]);

  return <ErrorBoundary resetKey={location.key}>{children}</ErrorBoundary>;
}

/** Every route renders inside the app boundary, so a crash shows its own message. */
function withBoundary(element: React.ReactNode) {
  return <RouteBoundary>{element}</RouteBoundary>;
}

const router = createBrowserRouter([
  { path: ROUTES.landing, element: withBoundary(<Landing />) },
  { path: ROUTES.dashboard, element: withBoundary(<Dashboard />) },
  { path: ROUTES.write, element: withBoundary(<Write />) },
  { path: WRITE_ENTRY_PATTERN, element: withBoundary(<Write />) },
  { path: READER_PATTERN, element: withBoundary(<Reader />) },
  { path: ROUTES.calendar, element: withBoundary(<Calendar />) },
  { path: ROUTES.stats, element: withBoundary(<Stats />) },
  { path: ROUTES.settings, element: withBoundary(<Settings />) },
  { path: '*', element: withBoundary(<NotFoundPage />) },
]);

/** Route table with lazy chunks and a shared suspense boundary. */
export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
