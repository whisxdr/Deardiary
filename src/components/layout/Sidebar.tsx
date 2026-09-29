import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, CalendarBlank, ChartBar, Gear, Notebook, PencilSimple } from '@phosphor-icons/react';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Entries', icon: Notebook },
  { to: ROUTES.calendar, label: 'Calendar', icon: CalendarBlank },
  { to: ROUTES.stats, label: 'Stats', icon: ChartBar },
  { to: ROUTES.settings, label: 'Settings', icon: Gear },
] as const;

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-over navigation used on small screens. */
export function Sidebar({ open, onClose }: SidebarProps) {
  // Escape closes the panel and focus moves into it, so the drawer is not mouse-only.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label="Main navigation"
        className="absolute inset-y-0 left-0 flex w-64 flex-col gap-2 border-r border-primary-700 bg-primary-800 p-5 shadow-hard"
      >
        <NavLink
          to={ROUTES.landing}
          onClick={onClose}
          autoFocus
          className="mb-4 flex items-center gap-2 font-display text-lg text-accent-gold"
        >
          <BookOpen size={20} weight="duotone" aria-hidden="true" />
          DearDiary
        </NavLink>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm transition-colors duration-fast',
                isActive ? 'bg-accent-gold/20 text-accent-cream' : 'text-primary-100/80 hover:bg-primary-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to={ROUTES.write}
          onClick={onClose}
          className="mt-auto flex items-center justify-center gap-2 rounded-md bg-accent-gold px-3 py-2 font-body text-sm text-primary-900"
        >
          <PencilSimple size={20} weight="regular" aria-hidden="true" />
          New entry
        </NavLink>
      </nav>
    </div>
  );
}
