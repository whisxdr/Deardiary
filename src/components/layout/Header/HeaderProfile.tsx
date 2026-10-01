import { Link } from 'react-router-dom';
import { Moon, PencilSimple, Gear, Sun, User } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { IconButton } from '@/components/common';
import { ROUTES } from '@/constants';
import { useClickOutside } from '@/hooks';
import { useEffect, useState } from 'react';
import { useSettingsStore, useSyncStore } from '@/store';
import { useTheme } from '@/hooks';

/** Avatar button with a dropdown for theme, settings and a new entry. */
export function HeaderProfile() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const { displayName, avatarSeed } = useSettingsStore((state) => state.settings);
  const accountEmail = useSyncStore((state) => state.account?.email ?? '');
  const { toggleTheme, isDark } = useTheme();

  // Click-outside only covers the mouse; the menu also has to answer Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
      >
        <Avatar name={displayName} seed={avatarSeed} size="sm" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-md border border-primary-200 bg-accent-cream py-1 shadow-hard dark:border-primary-700 dark:bg-primary-800"
        >
          <p className="border-b border-primary-200/70 px-3 py-2 font-body text-xs text-primary-500 dark:border-primary-700 dark:text-primary-300">
            {accountEmail ? `${displayName} · ${accountEmail}` : displayName}
          </p>
          <Link
            to={ROUTES.write}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 font-body text-sm text-primary-700 hover:bg-primary-100/70 dark:text-primary-100 dark:hover:bg-primary-700"
          >
            <PencilSimple size={16} aria-hidden="true" />
            New entry
          </Link>
          <Link
            to={ROUTES.settings}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 font-body text-sm text-primary-700 hover:bg-primary-100/70 dark:text-primary-100 dark:hover:bg-primary-700"
          >
            <Gear size={16} aria-hidden="true" />
            Settings
          </Link>
          <Link
            to={ROUTES.settings}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 font-body text-sm text-primary-700 hover:bg-primary-100/70 dark:text-primary-100 dark:hover:bg-primary-700"
          >
            <User size={16} aria-hidden="true" />
            Profile
          </Link>
          <div className="mt-1 flex items-center justify-between border-t border-primary-200/70 px-3 py-2 dark:border-primary-700">
            <span className="font-body text-xs text-primary-500 dark:text-primary-300">Theme</span>
            <IconButton
              label={isDark ? 'Switch to light theme' : 'Switch to night theme'}
              onClick={toggleTheme}
              icon={isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
