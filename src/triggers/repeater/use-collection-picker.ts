import { useMemo } from 'react';
import { useCollectionsStore, type StashRecord } from '@/stores/collections';

export interface CollectionNode {
  stashId: string;
  name: string;
}

function buildCollectionList(stashes: StashRecord[]): CollectionNode[] {
  return stashes
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((stash) => ({
      stashId: stash.id,
      name: stash.name,
    }));
}

export function useCollectionPicker() {
  const stashes = useCollectionsStore((s) => s.stashes);
  const isHydrated = useCollectionsStore((s) => s.isHydrated);
  const fetchFromDb = useCollectionsStore((s) => s.fetchFromDb);

  useMemo(() => {
    if (!isHydrated) {
      void fetchFromDb();
    }
  }, [isHydrated, fetchFromDb]);

  const collections = useMemo(
    () => (isHydrated ? buildCollectionList(stashes) : []),
    [stashes, isHydrated],
  );

  const isEmpty = isHydrated && collections.length === 0;

  return {
    collections,
    isLoading: !isHydrated,
    isEmpty,
  } as const;
}
