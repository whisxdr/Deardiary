import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUiStore } from '@/store';
import { cn } from '@/utils';

export interface AppLayoutProps {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

/** Shell shared by every authenticated page: header, sidebar, footer. */
export function AppLayout({ children, searchValue = '', onSearchChange, className }: AppLayoutProps) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSidebar = useUiStore((state) => state.setSidebar);

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 dark:bg-primary-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent-gold focus:px-3 focus:py-2 focus:font-body focus:text-sm"
      >
        Skip to content
      </a>
      <Header
        searchValue={searchValue}
        onSearchChange={onSearchChange ?? (() => undefined)}
        onOpenSidebar={toggleSidebar}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebar(false)} />
      <main
        id="main-content"
        className={cn('mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8', className)}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
