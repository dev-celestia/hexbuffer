import type { NetworkInterfaceInfo } from '../types';

export function formatInterfaceLabel(iface: NetworkInterfaceInfo): string {
  return `${iface.interface_type} (${iface.name}) - ${iface.ip}`;
}

export function getMethodColorClass(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'POST':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'PUT':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'DELETE':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'PATCH':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getStatusColorClass(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-emerald-600 dark:text-emerald-400 font-mono font-medium';
  }
  if (status >= 300 && status < 400) {
    return 'text-sky-600 dark:text-sky-400 font-mono font-medium';
  }
  if (status >= 400 && status < 500) {
    return 'text-amber-600 dark:text-amber-400 font-mono font-medium';
  }
  return 'text-rose-600 dark:text-rose-400 font-mono font-medium';
}
