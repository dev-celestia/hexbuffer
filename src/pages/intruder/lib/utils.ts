import type { AttackResult } from '../types';

export function formatPayloadValues(payloadValues: Record<string, string>) {
  return Object.entries(payloadValues)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

export function getResultUrl(result: AttackResult) {
  return result.response?.final_url ?? '';
}

export interface FilterResultsOptions {
  search?: string;
  statusCodes?: string[];
  onlyGrepMatch?: boolean;
  onlyErrors?: boolean;
}

export function filterResults(
  results: AttackResult[],
  optionsOrSearch?: string | FilterResultsOptions
): AttackResult[] {
  if (!optionsOrSearch) return results;

  const options: FilterResultsOptions =
    typeof optionsOrSearch === 'string'
      ? { search: optionsOrSearch }
      : optionsOrSearch;

  const {
    search = '',
    statusCodes = [],
    onlyGrepMatch = false,
    onlyErrors = false,
  } = options;

  const term = search.trim().toLowerCase();
  const hasStatusFilter = statusCodes.length > 0;

  return results.filter((result) => {
    // 1. Text Search across: status, payload values, url, error message, grep extracted
    if (term) {
      const matchStatus = result.status?.toString().includes(term);
      const matchPayload = formatPayloadValues(result.payload_values).toLowerCase().includes(term);
      const matchUrl = getResultUrl(result).toLowerCase().includes(term);
      const matchError = result.error ? result.error.toLowerCase().includes(term) : false;
      const matchGrep = result.grep_extracted ? result.grep_extracted.toLowerCase().includes(term) : false;

      if (!matchStatus && !matchPayload && !matchUrl && !matchError && !matchGrep) {
        return false;
      }
    }

    // 2. Only Errors filter
    if (onlyErrors && !result.error) {
      return false;
    }

    // 3. Only Grep Match filter
    if (onlyGrepMatch && !result.grep_match) {
      return false;
    }

    // 4. Status Codes filter (2xx, 3xx, 4xx, 5xx, errors, or exact numeric status)
    if (hasStatusFilter) {
      const status = result.status;
      const hasError = Boolean(result.error);

      const matchesAnyStatus = statusCodes.some((code) => {
        if (code === 'errors') return hasError;
        if (code === '2xx') return status !== undefined && status >= 200 && status < 300;
        if (code === '3xx') return status !== undefined && status >= 300 && status < 400;
        if (code === '4xx') return status !== undefined && status >= 400 && status < 500;
        if (code === '5xx') return status !== undefined && status >= 500 && status < 600;
        return status !== undefined && status.toString() === code;
      });

      if (!matchesAnyStatus) {
        return false;
      }
    }

    return true;
  });
}

