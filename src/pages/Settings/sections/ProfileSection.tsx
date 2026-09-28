import { Check } from '@phosphor-icons/react';
import { Avatar, Input, Textarea } from '@/components/ui';
import { AVATAR_SEED_CHOICES } from '@/constants/avatar';
import { useSettingsStore } from '@/store';
import { cn } from '@/utils';

/** Profile section: display name, bio and portrait seed. */
export function ProfileSection() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
      <h2 id="profile-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Profile
      </h2>
      <div className="flex items-center gap-4">
        <Avatar name={settings.displayName} seed={settings.avatarSeed} size="lg" />
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_SEED_CHOICES.map((seed) => {
            const active = settings.avatarSeed === seed;
            return (
              <button
                key={seed}
                type="button"
                onClick={() => update({ avatarSeed: seed })}
                aria-label={`Use the ${seed} portrait`}
                aria-pressed={active}
                className={cn(
                  'relative h-11 w-11 overflow-hidden rounded-md border transition-colors duration-fast',
                  active ? 'border-accent-gold ring-1 ring-accent-gold' : 'border-primary-200 dark:border-primary-700',
                )}
              >
                <Avatar name={seed} seed={seed} size="md" className="h-full w-full rounded-none border-0" />
                {active ? (
                  <span className="absolute bottom-0 right-0 bg-accent-gold text-primary-900">
                    <Check size={14} weight="bold" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <Input
        label="Display name"
        value={settings.displayName}
        onChange={(event) => update({ displayName: event.target.value })}
        maxLength={40}
      />
      <Textarea
        label="About you"
        rows={3}
        value={settings.bio}
        onChange={(event) => update({ bio: event.target.value })}
        maxLength={200}
      />
    </section>
  );
}
