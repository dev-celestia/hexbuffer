export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceType: 'user' | 'insight' | 'ai' | string;
  sourceRef?: string | null;
  url?: string | null;
  pinned: boolean;
  embedding?: number[] | null;
  embeddingModel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReindexResult {
  embedded: number;
  failed: number;
  total: number;
}
