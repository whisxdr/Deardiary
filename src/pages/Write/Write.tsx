import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { ConfirmDialog } from '@/components/common';
import { useKeyboard } from '@/hooks';
import { ROUTES } from '@/constants';
import { WriteEditor } from './WriteEditor';
import { WriteSidebar } from './WriteSidebar';
import { useEditorSetup } from './useEditorSetup';
import { useWriteForm } from './useWriteForm';

/** Composer page: rich editor on the left, entry details on the right. */
export default function Write() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { form, patch, publish, remove, saveNow, savedLabel, isSaving, isEditing, entry } = useWriteForm({
    id,
    templateId: searchParams.get('template'),
    backdated: searchParams.get('backdated') === 'true',
  });

  const { editor, words, characters, insertImage } = useEditorSetup({
    initialContent: form.content,
    entryId: id,
    storedContent: entry?.content,
    onUpdate: (html) => patch({ content: html }),
  });

  useKeyboard([
    { key: 's', ctrl: true, handler: saveNow },
    { key: 'b', ctrl: true, handler: () => editor?.chain().focus().toggleBold().run() },
    { key: 'i', ctrl: true, handler: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'Enter', ctrl: true, handler: publish },
    { key: 'Escape', handler: () => navigate(isEditing && id ? ROUTES.reader(id) : ROUTES.dashboard) },
  ]);

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <WriteEditor
          editor={editor}
          words={words}
          characters={characters}
          title={form.title}
          onTitleChange={(title) => patch({ title })}
          onInsertImage={insertImage}
        />
        <WriteSidebar
          date={form.date}
          location={form.location}
          mood={form.mood}
          tags={form.tags}
          isFavorite={form.isFavorite}
          isPrivate={form.isPrivate}
          savedLabel={savedLabel}
          isSaving={isSaving}
          onDateChange={(date) => patch({ date })}
          onLocationChange={(location) => patch({ location })}
          onMoodChange={(mood) => patch({ mood })}
          onTagsChange={(tags) => patch({ tags })}
          onFavoriteChange={(isFavorite) => patch({ isFavorite })}
          onPrivateChange={(isPrivate) => patch({ isPrivate })}
          onSaveDraft={saveNow}
          onPublish={publish}
          onDelete={() => setConfirmOpen(true)}
          canDelete={isEditing}
        />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this entry?"
        description="The entry will be removed from your diary on this device."
        confirmLabel="Delete entry"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          remove();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
