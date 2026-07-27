import type { DiscoveredApi } from '@/stores/browser-automation';

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'POST':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'PUT':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'PATCH':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'DELETE':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted';
  }
}

interface UseApiDiscoveryPanelProps {
  apis: DiscoveredApi[];
}

export function useApiDiscoveryPanel({ apis }: UseApiDiscoveryPanelProps) {
  return {
    count: apis.length,
    hasApis: apis.length > 0,
    getMethodColor,
  };
}
