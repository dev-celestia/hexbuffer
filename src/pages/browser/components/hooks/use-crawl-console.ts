import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityLog } from '../../types';

function logMatchesQuery(log: ActivityLog, query: string) {
  return (
    log.message.toLowerCase().includes(query) ||
    (log.url?.toLowerCase().includes(query) ?? false) ||
    log.type.toLowerCase().includes(query)
  );
}

export function useCrawlConsole(logs: ActivityLog[], searchQuery = '') {
  const [filterQuery, setFilterQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleLogs = useMemo(() => {
    const filter = filterQuery.trim().toLowerCase();
    const search = searchQuery.trim().toLowerCase();

    if (!filter && !search) return logs;

    return logs.filter((log) => {
      if (filter && !logMatchesQuery(log, filter)) return false;
      if (search && !logMatchesQuery(log, search)) return false;
      return true;
    });
  }, [logs, filterQuery, searchQuery]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs, autoScroll]);

  return {
    filterQuery,
    setFilterQuery,
    autoScroll,
    setAutoScroll,
    visibleLogs,
    scrollRef,
  };
}
