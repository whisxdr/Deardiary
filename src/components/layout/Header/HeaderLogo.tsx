import { NavLink } from 'react-router-dom';
import { BookOpen } from '@phosphor-icons/react';
import { APP_CONFIG, ROUTES } from '@/constants';
import { cn } from '@/utils';

const LINKS = [
  { to: ROUTES.dashboard, label: 'Entries' },
  { to: ROUTES.calendar, label: 'Calendar' },
  { to: ROUTES.stats, label: 'Stats' },
] as const;

/** Wordmark and primary navigation links for the app header. */
export function HeaderLogo() {
  return (
    <NavLink to={ROUTES.landing} className="flex items-center gap-2 focus-visible:outline-none">
      <BookOpen size={24} weight="duotone" aria-hidden="true" className="text-accent-gold" />
      <span className="font-display text-lg tracking-wide text-accent-cream">{APP_CONFIG.name}</span>
      <span className="sr-only">{APP_CONFIG.tagline}</span>
    </NavLink>
  );
}

/** Horizontal navigation shown from the medium breakpoint up. */
export function HeaderNav() {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 font-body text-sm transition-colors duration-fast',
              isActive ? 'bg-accent-gold/20 text-accent-cream' : 'text-primary-100/75 hover:bg-primary-700/70',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
