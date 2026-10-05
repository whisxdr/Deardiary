import { useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { useSettingsStore } from '@/store';
import { syncEnabled } from '@/services/supabase/config';
import {
  AboutSection,
  AppearanceSection,
  DataSection,
  PrivacySection,
  ProfileSection,
  SyncSection,
} from './sections';

/** Only offered when both Supabase env vars are set; see `services/supabase/config.ts`. */
const SYNC_LINKS = syncEnabled() ? [{ href: '#sync-heading', label: 'Account' }] : [];

const SECTION_LINKS = [
  { href: '#profile-heading', label: 'Profile' },
  { href: '#appearance-heading', label: 'Appearance' },
  { href: '#privacy-heading', label: 'Privacy' },
  ...SYNC_LINKS,
  { href: '#data-heading', label: 'Data' },
  { href: '#about-heading', label: 'About' },
] as const;

/** Settings page: profile, appearance, privacy, data, about. */
export default function Settings() {
  const hydrate = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl text-primary-800 dark:text-primary-100 sm:text-3xl">Settings</h1>
          <p className="font-body text-sm text-primary-500 dark:text-primary-300">
            Make the diary feel like yours. Changes save as you type.
          </p>
        </header>

        <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-primary-200 px-3 py-1 font-body text-xs text-primary-600 transition-colors duration-fast hover:border-accent-gold dark:border-primary-700 dark:text-primary-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileSection />
          <AppearanceSection />
          <PrivacySection />
          {syncEnabled() ? <SyncSection /> : null}
          <DataSection />
          <AboutSection />
        </div>
      </div>
    </AppLayout>
  );
}
