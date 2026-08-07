import { useMemo } from "react";

export const PARAM_COLORS = [
  "#e06c75",
  "#61afef",
  "#98c379",
  "#e5c07b",
  "#c678dd",
  "#56b6c2",
  "#d19a66",
];

export interface UseColoredUrlOptions {
  url: string;
}

export function useColoredUrl({ url }: UseColoredUrlOptions) {
  const parsedUrl = useMemo(() => {
    try {
      const qIdx = url.indexOf("?");
      if (qIdx === -1) {
        return {
          hasQueryParams: false,
          base: url,
          pairs: [] as string[],
        };
      }
      const base = url.slice(0, qIdx + 1);
      const pairs = url.slice(qIdx + 1).split("&");
      return {
        hasQueryParams: true,
        base,
        pairs,
      };
    } catch {
      return {
        hasQueryParams: false,
        base: url,
        pairs: [] as string[],
      };
    }
  }, [url]);

  return {
    ...parsedUrl,
    paramColors: PARAM_COLORS,
  };
}
