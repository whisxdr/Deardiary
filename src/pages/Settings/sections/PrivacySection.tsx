import { Toggle } from '@/components/ui';
import { syncEnabled } from '@/services/supabase/config';
import { useSettingsStore, useSyncStore } from '@/store';

/**
 * The privacy line for the current sync state.
 *
 * Config-off keeps the exact local-only sentence the regression suite asserts. When sync is
 * available the copy has to stay honest: signed in, entries really do leave the browser, are
 * stored as plain text, and the private flag is not encryption — claiming otherwise would be
 * the one lie this app cannot afford.
 */
function privacyCopy(signedIn: boolean): string {
  if (!syncEnabled()) return 'Entries never leave this browser unless you export them yourself.';
  if (signedIn) {
    return 'Sync is on: entries are stored on this device and uploaded to your account as plain text, readable by anyone with access to that project.';
  }
  return 'Entries stay in this browser until you sign in. Sync is available in this build, but nothing is uploaded while you are signed out.';
}

/** Privacy section: local-only flags for private entries. */
export function PrivacySection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const signedIn = useSyncStore((state) => state.account !== null);

  const setPrivacy = (patch: Partial<typeof settings.privacy>) =>
    update({ privacy: { ...settings.privacy, ...patch } });

  return (
    <section aria-labelledby="privacy-heading" className="flex flex-col gap-3">
      <h2 id="privacy-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Privacy
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">{privacyCopy(signedIn)}</p>
      <Toggle
        label="Hide private entries by default"
        description="Private entries stay out of the entries list and the stats until you turn this off."
        checked={settings.privacy.hidePrivateEntries}
        onChange={(hidePrivateEntries) => setPrivacy({ hidePrivateEntries })}
      />
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        This hides private entries from the app's own screens. It does not encrypt them: anything in this browser's
        storage can still be read by someone with access to this device.
      </p>
    </section>
  );
}
