export interface MemoryTypeOption {
  id: string;
  label: string;
  description: string;
}

export const MEMORY_TYPES: readonly MemoryTypeOption[] = [
  { id: 'all', label: 'All Types', description: 'Show all memory entries' },
  { id: 'fact', label: 'Fact', description: 'Verified target information or domain facts' },
  { id: 'finding', label: 'Finding', description: 'Security vulnerability or recon observation' },
  { id: 'credential', label: 'Credential', description: 'Exposed secret, token, or password' },
  { id: 'procedure', label: 'Procedure', description: 'Step-by-step reproduction or exploit guide' },
  { id: 'decision', label: 'Decision', description: 'Architectural or scope decision' },
  { id: 'context', label: 'Context', description: 'General target environment or scope context' },
];

export interface EdgeRelationOption {
  id: string;
  label: string;
  description: string;
}

export const EDGE_RELATIONS: readonly EdgeRelationOption[] = [
  { id: 'references', label: 'References', description: 'Source mentions or relates to target' },
  { id: 'supersedes', label: 'Supersedes', description: 'Source replaces or invalidates target' },
  { id: 'contradicts', label: 'Contradicts', description: 'Source contradicts target finding' },
  { id: 'similar_to', label: 'Similar To', description: 'Semantic proximity or duplicate finding' },
];

export const DEFAULT_NAMESPACE = 'default';
export const DEFAULT_IMPORTANCE = 0.5;
