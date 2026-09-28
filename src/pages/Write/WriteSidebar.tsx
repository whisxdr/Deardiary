import { CheckCircle, FloppyDisk, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { Button, Input, Toggle } from '@/components/ui';
import { DatePicker, MoodPicker, TagInput } from '@/components/editor';
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
export function WriteSidebar({
  date,
  location,
  mood,
  tags,
  isFavorite,
  isPrivate,
  savedLabel,
  isSaving,
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
}: WriteSidebarProps) {
  return (
    <aside
      aria-label="Entry details"
      className="flex flex-col gap-5 rounded-lg border border-primary-200/70 bg-accent-cream/90 p-4 shadow-soft paper-texture dark:border-primary-700 dark:bg-primary-800/70"
    >
      <section className="flex flex-col gap-3">
        <SectionTitle>Details</SectionTitle>
        <DatePicker value={date} onChange={onDateChange} />
        <Input
          label="Location"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="Where were you?"
        />
        <p aria-live="polite" className="flex items-center gap-1 font-body text-xs text-muted">
          {isSaving ? (
            'Saving…'
          ) : (
            <>
              <CheckCircle size={14} weight="fill" aria-hidden="true" className="text-success" />
              {savedLabel}
            </>
          )}
        </p>
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
        <Button variant="outline" onClick={onSaveDraft}>
          <FloppyDisk size={16} weight="regular" aria-hidden="true" />
          Save draft
        </Button>
        <Button variant="gold" onClick={onPublish}>
          <PaperPlaneTilt size={16} weight="regular" aria-hidden="true" />
          Publish
        </Button>
        {canDelete ? (
          <Button variant="danger" onClick={onDelete}>
            <Trash size={16} weight="regular" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </section>
    </aside>
  );
}
