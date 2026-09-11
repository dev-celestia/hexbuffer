import type { SplitLayoutType } from '@/stores/split-view';

export interface SplitLayoutOption {
  id: SplitLayoutType;
  label: string;
  title: string;
  description: string;
  slotCount: number;
}

export const SPLIT_LAYOUT_OPTIONS: SplitLayoutOption[] = [
  {
    id: 'split-2',
    label: '2-Split',
    title: 'Dual Split Screen',
    description: '2 applications side-by-side with resizable vertical divider',
    slotCount: 2,
  },
  {
    id: 'split-3',
    label: '3-Split',
    title: 'Sub-Split Screen',
    description: '1 full-height primary slot with 2 horizontal sub-splits on the right',
    slotCount: 3,
  },
  {
    id: 'split-4',
    label: '4-Split',
    title: 'Quad Split Screen',
    description: '4 applications in a balanced 2x2 grid',
    slotCount: 4,
  },
];

export const EXCLUDED_APP_ROUTES = ['/', '/split-view'];
