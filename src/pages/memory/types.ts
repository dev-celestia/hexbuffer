export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  namespace: string;
  memoryType: 'fact' | 'procedure' | 'decision' | 'finding' | 'credential' | 'context' | string;
  importance: number;
  pinned: boolean;
  authorType: 'human' | 'agent' | string;
  source?: string | null;
  sourceType: string;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
  edgesCount: number;
}

export interface SaveMemoryPayload {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  namespace?: string;
  memoryType?: string;
  importance?: number;
  pinned?: boolean;
  source?: string;
  sourceType?: string;
}

export interface MemoryEdge {
  targetId: string;
  edgeType: string;
}

export interface DreamReport {
  status: string;
  deduplicated: number;
  contradictions: number;
  orphans: number;
  backlinksRebuilt: number;
  message: string;
}

export interface EngineStatus {
  engine: string;
  model: string;
  totalMemories: number;
  isReady: boolean;
}
