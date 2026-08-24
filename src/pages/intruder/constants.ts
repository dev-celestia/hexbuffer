import type { PayloadType } from './types';

export const PAYLOAD_TYPES: PayloadType[] = [
  'SimpleList',
  'RuntimeFile',
  'NumberRange',
];

export const INTRUDER_STATUS_FILTERS = [
  { label: '2xx', desc: 'Success (200-299)' },
  { label: '3xx', desc: 'Redirection (300-399)' },
  { label: '4xx', desc: 'Client Error (400-499)' },
  { label: '5xx', desc: 'Server Error (500-599)' },
  { label: 'errors', desc: 'Network / Attack Errors' },
] as const;

