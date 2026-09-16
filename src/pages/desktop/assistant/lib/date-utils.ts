import type { DashboardChatMessage } from '../types';

const MAX_DATE_CACHE_SIZE = 300;
const messageDateCache = new Map<string, Date>();

/**
 * Returns a stable Date for a chat message, caching fallbacks by message ID.
 */
export function getMessageDate(message: DashboardChatMessage): Date {
  if (message.createdAt instanceof Date) {
    return message.createdAt;
  }
  if (typeof message.createdAt === 'string' && message.createdAt) {
    const parsed = new Date(message.createdAt);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const cached = messageDateCache.get(message.id);
  if (cached) {
    return cached;
  }

  if (messageDateCache.size >= MAX_DATE_CACHE_SIZE) {
    const oldestKey = messageDateCache.keys().next().value;
    if (oldestKey) {
      messageDateCache.delete(oldestKey);
    }
  }

  const now = new Date();
  messageDateCache.set(message.id, now);
  return now;
}

/**
 * Formats time to 24-hour HH:mm string (e.g., '14:23').
 */
export function formatMessageTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Formats date for chat separator:
 * - 'Today'
 * - 'Yesterday'
 * - '2 days ago' .. '6 days ago'
 * - '24 January' (or '24 January 2025' if different year)
 */
export function formatChatDateSeparator(date: Date): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((todayStart - targetStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays >= 2 && diffDays <= 6) {
    return `${diffDays} days ago`;
  }

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${date.getFullYear()}`;
}

/**
 * Returns true if two dates fall on different calendar days.
 */
export function isDifferentDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}
