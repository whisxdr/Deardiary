import { useEffect, useRef } from 'react';
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

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over navigation used on small screens.
 *
 * It behaves as a modal dialog: focus moves into the panel, Tab stays inside it, the page
 * behind it is inert, and closing hands focus back to the button that opened it.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  // `onClose` is an inline arrow at the call site, so its identity changes on every parent
  // render. Holding it in a ref keeps the effect below keyed on `open` alone: re-running
  // it would overwrite the restore target with an element inside the panel.
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Escape closes the panel, so the drawer is not mouse-only.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // The siblings of this panel are the header, main and footer: everything behind the
    // overlay. Inert keeps Tab and the screen reader out of them while the drawer is up.
    restoreRef.current = document.activeElement as HTMLElement | null;
    const behind = Array.from(panel.parentElement?.children ?? []).filter(
      (node): node is HTMLElement => node !== panel && node instanceof HTMLElement,
    );
    behind.forEach((node) => {
      node.inert = true;
    });
    (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      behind.forEach((node) => {
        node.inert = false;
      });
      restoreRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      tabIndex={-1}
      className="fixed inset-0 z-40 lg:hidden focus:outline-none"
    >
      <div className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label="Main navigation"
        className="absolute inset-y-0 left-0 flex w-64 flex-col gap-2 border-r border-primary-700 bg-primary-800 p-5 shadow-hard"
      >
        <NavLink
          to={ROUTES.landing}
          onClick={onClose}
          className="mb-4 flex items-center gap-2 rounded-md font-display text-lg text-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
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
          className="mt-auto flex items-center justify-center gap-2 rounded-md bg-accent-gold px-3 py-2 font-body text-sm text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
        >
          <PencilSimple size={20} weight="regular" aria-hidden="true" />
          New entry
        </NavLink>
      </nav>
    </div>
  );
}
