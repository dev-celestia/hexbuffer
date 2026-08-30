import type { NoteFilterTab, NoteSortOption } from './types';

export const NOTE_FILTER_TABS: { id: NoteFilterTab; label: string }[] = [
  { id: 'all', label: 'All Notes' },
  { id: 'open', label: 'Open in Tabs' },
  { id: 'closed', label: 'Closed' },
];

export const NOTE_SORT_OPTIONS: { value: NoteSortOption; label: string }[] = [
  { value: 'updated-desc', label: 'Recently Modified' },
  { value: 'updated-asc', label: 'Oldest Modified' },
  { value: 'created-desc', label: 'Recently Created' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
];

export const MAX_NOTES_COUNT = 100;
