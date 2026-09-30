import { useState } from 'react';
import { Button, toast } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import { useSettingsStore } from '@/store';

/** Restores every preference to its default, behind a confirmation. */
export function RestoreDefaultsButton() {
  const reset = useSettingsStore((state) => state.reset);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Restore default settings
      </Button>
      <ConfirmDialog
        open={open}
        title="Restore default settings?"
        description="Name, bio, theme and font size go back to their defaults. Your entries are not touched."
        body="Only preferences are reset. Entries stay in this browser until you delete them yourself."
        confirmLabel="Restore defaults"
        destructive
        onConfirm={() => {
          reset();
          setOpen(false);
          toast.success('Settings restored to defaults');
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
