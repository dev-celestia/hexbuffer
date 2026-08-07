import { useEffect, useState, useMemo } from 'react';
import { getHttpLogDetail } from '@/pages/live-traffic/http-history/api';
import { adaptProxyRecordToApiCall } from '@/pages/live-traffic/http-history/components/log-table/hooks/use-history-table';
import { formatJsonBody } from '@/lib/http-message';
import { buildHeadersList } from '@/pages/live-traffic/components/inspector';
import { parseCookieHeader, isJsonContent } from '@/pages/live-traffic/http-history/components/log-table/utils';
import type { ApiCall } from '@/types';


export interface UseResponseDetailWindowOptions {
  callId: string;
}

export function useResponseDetailWindow({ callId }: UseResponseDetailWindowOptions) {
  const [call, setCall] = useState<ApiCall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCall = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await getHttpLogDetail(callId);
        if (!cancelled) {
          setCall(adaptProxyRecordToApiCall(detail));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load response details.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchCall();
    return () => { cancelled = true; };
  }, [callId]);

  const statusVariant = useMemo(() => {
    if (!call?.response_status) return 'secondary' as const;
    if (call.response_status >= 200 && call.response_status < 300) return 'default' as const;
    if (call.response_status >= 400) return 'destructive' as const;
    return 'secondary' as const;
  }, [call?.response_status]);

  const responseHeaders = useMemo(() => {
    return call ? buildHeadersList(call.response_headers) : [];
  }, [call]);

  const responseCookies = useMemo(() => {
    return call ? parseCookieHeader(call.response_headers['set-cookie']) : [];
  }, [call]);

  const responseBodyItem = useMemo(() => {
    if (!call) return [];
    return [{
      name: 'Response Body',
      value: isJsonContent(call.response_headers, call.response_body)
        ? formatJsonBody(call.response_body ?? '')
        : call.response_body ?? '',
    }];
  }, [call]);

  return {
    call,
    isLoading,
    error,
    statusVariant,
    responseHeaders,
    responseCookies,
    responseBodyItem,
  };
}
