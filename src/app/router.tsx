import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common';
import { Loading } from '@/components/illustrations';
import { READER_PATTERN, ROUTES, WRITE_ENTRY_PATTERN } from '@/constants';

const Landing = lazy(() => import('@/pages/Landing/Landing'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const Write = lazy(() => import('@/pages/Write/Write'));
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

/** Every route renders inside the app boundary, so a crash shows its own message. */
function withBoundary(element: React.ReactNode) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
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
