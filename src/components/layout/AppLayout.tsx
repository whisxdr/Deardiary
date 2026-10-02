import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ROUTES } from '@/constants';
import { useUiStore } from '@/store';
import { cn } from '@/utils';

export interface AppLayoutProps {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

/**
 * Shell shared by every authenticated page: header, sidebar, footer.
 *
 * Pages that filter their own content pass `onSearchChange`. On every other page the
 * box would otherwise render but do nothing, so it hands the query to the dashboard,
 * which is the page that can act on it.
 *
 * The uncontrolled path keeps the query in a ref rather than state: the header is above
 * every page, so a state update here would re-render the whole tree on each keystroke.
 * The box holds its own text until the value settles.
 */
export function AppLayout({ children, searchValue, onSearchChange, className }: AppLayoutProps) {
  const navigate = useNavigate();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSidebar = useUiStore((state) => state.setSidebar);
  const fallbackSearch = useRef('');

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    fallbackSearch.current = value;
    // `replace` keeps typing from filling the history with one entry per keystroke.
    navigate(`${ROUTES.dashboard}?q=${encodeURIComponent(value)}`, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 dark:bg-primary-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent-gold focus:px-3 focus:py-2 focus:font-body focus:text-sm"
      >
        Skip to content
      </a>
      <Header
        searchValue={onSearchChange ? (searchValue ?? '') : fallbackSearch.current}
        onSearchChange={handleSearchChange}
        onOpenSidebar={toggleSidebar}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebar(false)} />
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'mx-auto w-full max-w-7xl flex-1 px-4 py-6 focus:outline-none sm:px-6 sm:py-8',
          className,
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
