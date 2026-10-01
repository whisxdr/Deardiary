import { Toggle } from '@/components/ui';
import { useSettingsStore, useSyncStore } from '@/store';
import { syncEnabled } from '@/services/sync/config';

/** Privacy section: local-only flags for private entries. */
export function PrivacySection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const signedIn = useSyncStore((state) => state.account) !== null;
  const syncing = syncEnabled() && signedIn;

  const setPrivacy = (patch: Partial<typeof settings.privacy>) =>
    update({ privacy: { ...settings.privacy, ...patch } });

  return (
    <section aria-labelledby="privacy-heading" className="flex flex-col gap-3">
      <h2 id="privacy-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Privacy
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        {syncing
          ? 'Entries are copied to your account on the sync server while you are signed in.'
          : 'Entries never leave this browser unless you export them yourself.'}
      </p>
      <Toggle
        label="Hide private entries by default"
        description="Private entries stay out of the entries list and the stats until you turn this off."
        checked={settings.privacy.hidePrivateEntries}
        onChange={(hidePrivateEntries) => setPrivacy({ hidePrivateEntries })}
      />
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        {syncing
          ? 'This hides private entries from the app\u2019s own screens. It does not encrypt them: they are stored in plain text both here and on the sync server, so it is not a way to keep them secret from anyone with access to either.'
          : 'This hides private entries from the app\u2019s own screens. It does not encrypt them: anything in this browser\u2019s storage can still be read by someone with access to this device.'}
      </p>
    </section>
  );
}
