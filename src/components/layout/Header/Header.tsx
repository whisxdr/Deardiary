import { List } from '@phosphor-icons/react';
import { HeaderLogo, HeaderNav } from './HeaderLogo';
import { HeaderSearch } from './HeaderSearch';
import { HeaderProfile } from './HeaderProfile';
import { IconButton } from '@/components/common';

export interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenSidebar: () => void;
}

/** App header: brand, navigation, search and account menu. */
export function Header({ searchValue, onSearchChange, onOpenSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-primary-800/60 bg-primary-700/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6 md:flex-nowrap md:py-0">
        <div className="flex flex-1 items-center gap-3 md:flex-none md:py-3">
          <IconButton
            label="Open navigation"
            onClick={onOpenSidebar}
            icon={<List size={20} aria-hidden="true" />}
            className="text-accent-cream hover:bg-primary-600 lg:hidden"
          />
          <HeaderLogo />
          <HeaderNav />
        </div>
        <HeaderSearch
          value={searchValue}
          onChange={onSearchChange}
          className="order-last w-full md:order-none md:ml-auto md:w-full md:max-w-xs"
        />
        <HeaderProfile />
      </div>
    </header>
  );
}
