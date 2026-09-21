import * as React from 'react';
import { useWebSocketHistoryQueryStore } from '@/stores/history';

export interface UseWebSocketSearchResult {
  localSearch: string;
  handleSearchChange: (val: string) => void;
  handleClearSearch: () => void;
}

export function useWebSocketSearch(): UseWebSocketSearchResult {
  const search = useWebSocketHistoryQueryStore((s) => s.filter.search);
  const setSearch = useWebSocketHistoryQueryStore((s) => s.setSearch);

  const [localSearch, setLocalSearch] = React.useState(search || '');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = React.useCallback((val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
    }, 200);
  }, [setSearch]);

  const handleClearSearch = React.useCallback(() => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
  }, [setSearch]);

  return {
    localSearch,
    handleSearchChange,
    handleClearSearch,
  };
}
