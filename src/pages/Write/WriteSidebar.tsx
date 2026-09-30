import { Toggle } from '@/components/ui';
import { MoodPicker, TagInput } from '@/components/editor';
import { SidebarActions } from './SidebarActions';
import { SidebarDetails } from './SidebarDetails';
import type { SaveError } from './saveError';
import type { Mood } from '@/types';

export interface WriteSidebarProps {
  date: string;
  location: string;
  mood: Mood;
  tags: string[];
  isFavorite: boolean;
  isPrivate: boolean;
  savedLabel: string;
  isSaving: boolean;
  saveError: SaveError;
  onDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onMoodChange: (mood: Mood) => void;
  onTagsChange: (tags: string[]) => void;
  onFavoriteChange: (value: boolean) => void;
  onPrivateChange: (value: boolean) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

/** Heading shared by every sidebar section. */
function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-body text-xs uppercase tracking-wide text-muted">{children}</h2>;
}

/** Detail, mood, tag and action sections beside the editor. */
export function WriteSidebar(props: WriteSidebarProps) {
  const {
    date,
    location,
    mood,
    tags,
    isFavorite,
    isPrivate,
    savedLabel,
    isSaving,
    saveError,
    onDateChange,
    onLocationChange,
    onMoodChange,
    onTagsChange,
    onFavoriteChange,
    onPrivateChange,
    onSaveDraft,
    onPublish,
    onDelete,
    canDelete,
  } = props;

  return (
    <aside
      aria-label="Entry details"
      className="flex flex-col gap-5 rounded-lg border border-primary-200/70 bg-accent-cream/90 p-4 shadow-soft paper-texture dark:border-primary-700 dark:bg-primary-800/70"
    >
      <section className="flex flex-col gap-3">
        <SectionTitle>Details</SectionTitle>
        <SidebarDetails
          date={date}
          location={location}
          savedLabel={savedLabel}
          isSaving={isSaving}
          saveError={saveError}
          onDateChange={onDateChange}
          onLocationChange={onLocationChange}
        />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Mood</SectionTitle>
        <MoodPicker value={mood} onChange={onMoodChange} />
      </section>

      <section className="flex flex-col gap-2">
        <TagInput tags={tags} onChange={onTagsChange} />
      </section>

      <section className="flex flex-col gap-1 border-t border-primary-200/60 pt-3 dark:border-primary-700/60">
        <SectionTitle>Options</SectionTitle>
        <Toggle label="Favorite" checked={isFavorite} onChange={onFavoriteChange} description="Pin to favorites" />
        <Toggle label="Private" checked={isPrivate} onChange={onPrivateChange} description="Mark as personal" />
      </section>

      <section className="flex flex-col gap-2 border-t border-primary-200/60 pt-3 dark:border-primary-700/60">
        <SectionTitle>Actions</SectionTitle>
        <SidebarActions onSaveDraft={onSaveDraft} onPublish={onPublish} onDelete={onDelete} canDelete={canDelete} />
      </section>
    </aside>
  );
}
