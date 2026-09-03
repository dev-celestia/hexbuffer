import { HTTP_METHODS } from '../../constants';

export const ALL_METHODS = ['ALL', ...HTTP_METHODS] as const;

export const METHOD_COLORS: Record<string, string> = {
  ALL: 'text-purple-400 font-bold',
  GET: 'text-green-500 font-bold',
  POST: 'text-blue-500 font-bold',
  PUT: 'text-yellow-500 font-bold',
  DELETE: 'text-red-500 font-bold',
  PATCH: 'text-orange-500 font-bold',
  OPTIONS: 'text-purple-500 font-bold',
};
