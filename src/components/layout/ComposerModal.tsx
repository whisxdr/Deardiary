import { motion } from 'framer-motion';
import { CalendarBlank, FileText, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ENTRY_TEMPLATES } from '@/constants/editor';

export interface EntryTypeOption {
  id: string;
  name: string;
  description: string;
  icon: 'blank' | 'template' | 'dated';
  /** Template to open the editor with; `free` is the empty page. */
  templateId: string;
}

const ICONS = {
  blank: FileText,
  template: Sparkle,
  dated: CalendarBlank,
} as const;

/**
 * Choices offered by the composer modal.
 *
 * Every template with content gets its own row. Listing them from the constants keeps
 * a template from being reachable in the editor but unreachable from here.
 */
export const ENTRY_TYPE_OPTIONS: EntryTypeOption[] = [
  { id: 'blank', name: 'Blank page', description: 'Start with an empty page.', icon: 'blank', templateId: 'free' },
  ...ENTRY_TEMPLATES.filter((template) => template.content).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    icon: 'template' as const,
    templateId: template.id,
  })),
  {
    id: 'dated',
    name: 'Backdated entry',
    description: 'Write about an earlier day.',
    icon: 'dated',
    templateId: 'free',
  },
];

export interface ComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string, backdated: boolean) => void;
}

/** Modal that picks which kind of entry to start before routing to the editor. */
export function ComposerModal({ open, onClose, onSelect }: ComposerModalProps) {
  return (
    <Modal
      open={open}
      title="What would you like to write?"
      description="Pick a starting point. You can change everything later."
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        {ENTRY_TYPE_OPTIONS.map((option, index) => {
          const Icon = ICONS[option.icon];
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              onClick={() => onSelect(option.templateId, option.id === 'dated')}
              className="flex items-start gap-3 rounded-md border border-primary-200 bg-primary-50/70 p-3 text-left transition-colors duration-fast hover:border-accent-gold dark:border-primary-700 dark:bg-primary-800/60"
            >
              <span aria-hidden="true" className="mt-0.5 text-accent-gold">
                <Icon size={20} weight="regular" />
              </span>
              <span className="flex flex-col">
                <span className="font-body text-sm font-medium text-primary-700 dark:text-primary-100">
                  {option.name}
                </span>
                <span className="font-body text-xs text-primary-500 dark:text-primary-300">{option.description}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
