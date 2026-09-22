import { HTTP_METHODS } from '../../constants';

export const ALL_METHODS = ['ALL', ...HTTP_METHODS] as const;

export const METHOD_COLORS: Record<string, string> = {
  ALL: 'text-purple-600 dark:text-purple-400 font-bold',
  GET: 'text-green-600 dark:text-green-400 font-bold',
  POST: 'text-blue-600 dark:text-blue-400 font-bold',
  PUT: 'text-yellow-600 dark:text-yellow-400 font-bold',
  DELETE: 'text-red-600 dark:text-red-400 font-bold',
  PATCH: 'text-orange-600 dark:text-orange-400 font-bold',
  OPTIONS: 'text-purple-600 dark:text-purple-400 font-bold',
};
