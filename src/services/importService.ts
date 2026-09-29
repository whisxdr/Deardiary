import { BACKUP_VERSION } from '@/constants/storageKeys';
import { coerceEntry, looksLikeEntry } from './entryFields';
import type { BackupPayload, Entry } from '@/types';

/** Result of a backup import attempt. */
export interface ImportResult {
  ok: boolean;
  entries: Entry[];
  settings?: BackupPayload['settings'];
  message: string;
}

/** True when the file was written by a newer build than this one. */
function isNewerVersion(version: unknown): boolean {
  return typeof version === 'number' && version > BACKUP_VERSION;
}

/** Parses an uploaded JSON backup into entries and settings. */
export function parseBackup(rawText: string): ImportResult {
  try {
    const parsed = JSON.parse(rawText) as BackupPayload | Partial<Entry>[];
    const list = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(list)) {
      return { ok: false, entries: [], message: 'No entries found in that file.' };
    }
    if (!Array.isArray(parsed) && isNewerVersion(parsed.version)) {
      return {
        ok: false,
        entries: [],
        message: `That backup was written by a newer version of DearDiary (v${parsed.version}). Update the app first.`,
      };
    }

    const entries = list.filter(looksLikeEntry).map(coerceEntry);
    return {
      ok: entries.length > 0,
      entries,
      settings: Array.isArray(parsed) ? undefined : parsed.settings,
      message: entries.length > 0 ? `Imported ${entries.length} entries.` : 'No valid entries found.',
    };
  } catch {
    return { ok: false, entries: [], message: 'That file is not valid JSON.' };
  }
}

/** Reads a File and parses it as a backup. */
export async function importBackupFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    return parseBackup(text);
  } catch {
    return { ok: false, entries: [], message: 'That file could not be read.' };
  }
}
