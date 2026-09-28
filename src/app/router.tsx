import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

const router = createBrowserRouter([
  { path: ROUTES.landing, element: <Landing /> },
  { path: ROUTES.dashboard, element: <Dashboard /> },
  { path: ROUTES.write, element: <Write /> },
  { path: WRITE_ENTRY_PATTERN, element: <Write /> },
  { path: READER_PATTERN, element: <Reader /> },
  { path: ROUTES.calendar, element: <Calendar /> },
  { path: ROUTES.stats, element: <Stats /> },
  { path: ROUTES.settings, element: <Settings /> },
  { path: '*', element: <NotFoundPage /> },
]);

/** Route table with lazy chunks and a shared suspense boundary. */
export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
