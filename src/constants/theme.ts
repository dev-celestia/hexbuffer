export type PrimaryColor =
  | 'emerald'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'cyan';

export interface PrimaryColorPreset {
  id: PrimaryColor;
  name: string;
  swatchHex: string;
  lightOklch: string;
  darkOklch: string;
}

export const PRIMARY_COLOR_PRESETS: PrimaryColorPreset[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    swatchHex: '#10b981',
    lightOklch: 'oklch(0.596 0.145 163.225)',
    darkOklch: 'oklch(0.696 0.17 162.48)',
  },
  {
    id: 'blue',
    name: 'Blue',
    swatchHex: '#3b82f6',
    lightOklch: 'oklch(0.546 0.215 262.881)',
    darkOklch: 'oklch(0.623 0.214 259.815)',
  },
  {
    id: 'violet',
    name: 'Violet',
    swatchHex: '#8b5cf6',
    lightOklch: 'oklch(0.541 0.236 288.243)',
    darkOklch: 'oklch(0.656 0.241 292.759)',
  },
  {
    id: 'rose',
    name: 'Rose',
    swatchHex: '#f43f5e',
    lightOklch: 'oklch(0.587 0.225 10.708)',
    darkOklch: 'oklch(0.645 0.246 16.439)',
  },
  {
    id: 'amber',
    name: 'Amber',
    swatchHex: '#f59e0b',
    lightOklch: 'oklch(0.666 0.179 58.318)',
    darkOklch: 'oklch(0.769 0.188 70.08)',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    swatchHex: '#06b6d4',
    lightOklch: 'oklch(0.589 0.148 214.279)',
    darkOklch: 'oklch(0.715 0.143 215.221)',
  },
];
