import { useBrowserIcon } from "./hooks/use-browser-icon";
import { cn } from "@/lib/utils";

export { detectBrowser, type BrowserKind } from "./hooks/use-browser-icon";

export function BrowserIcon({ userAgent }: { userAgent: string | null }) {
  const { browser, iconSrc, title } = useBrowserIcon({ userAgent });

  if (!browser || !iconSrc) return null;

  return (
    <img
      src={iconSrc}
      alt={browser}
      title={title ?? undefined}
      className={cn(
        // Layout & Positioning
        "shrink-0",

        // Sizing & Spacing
        "size-3.5"
      )}
    />
  );
}
