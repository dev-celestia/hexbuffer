import { invokeTauri, isTauriAvailable } from '@/lib/ipc';
import type { Scratchpad } from '@/stores/scratchpad';

/** Wire shape of a note row. Timestamps are RFC3339 strings, matching the SQLite column type. */
interface NoteRecord {
  id: string;
  name: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export { isTauriAvailable };

/** Epoch millis (the frontend representation) to RFC3339, or '' to let the backend assign it. */
function toIsoString(ms: number | undefined): string {
  return typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

function toEpochMillis(iso: string): number | undefined {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : ms;
}

function toScratchpad(record: NoteRecord): Scratchpad {
  return {
    id: record.id,
    name: record.name,
    note: record.note,
    createdAt: toEpochMillis(record.createdAt),
    updatedAt: toEpochMillis(record.updatedAt),
  };
}

function toNoteRecord(pad: Scratchpad): NoteRecord {
  return {
    id: pad.id,
    name: pad.name,
    note: pad.note,
    createdAt: toIsoString(pad.createdAt),
    updatedAt: toIsoString(pad.updatedAt),
  };
}

export async function listNotes(): Promise<Scratchpad[]> {
  const records = await invokeTauri<NoteRecord[]>('list_notes');
  return records.map(toScratchpad);
}

export async function saveNote(pad: Scratchpad): Promise<Scratchpad> {
  const record = await invokeTauri<NoteRecord>('save_note', { note: toNoteRecord(pad) });
  return toScratchpad(record);
}

/** Inserts notes that are not already present; used for the localStorage migration and seeding. */
export async function importNotes(pads: Scratchpad[]): Promise<number> {
  return invokeTauri<number>('import_notes', { notes: pads.map(toNoteRecord) });
}

export async function deleteNote(id: string): Promise<void> {
  await invokeTauri<void>('delete_note', { id });
}

export async function deleteNotes(ids: string[]): Promise<number> {
  return invokeTauri<number>('delete_notes', { ids });
}