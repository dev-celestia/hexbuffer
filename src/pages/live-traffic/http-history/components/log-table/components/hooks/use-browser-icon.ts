import chromeIcon from "@/assets/icons/chrome.png";
import firefoxIcon from "@/assets/icons/firefox.png";
import safariIcon from "@/assets/icons/safari.png";

export type BrowserKind = "chrome" | "firefox" | "safari" | null;

export function detectBrowser(userAgent: string | null): BrowserKind {
  if (!userAgent) return null;
  const lower = userAgent.toLowerCase();
  if (lower.includes("firefox")) return "firefox";
  if (lower.includes("safari") && !lower.includes("chrome")) return "safari";
  // Edge, Opera, Brave include "Chrome" in their UA — don't match those
  if (lower.includes("edg") || lower.includes("opr") || lower.includes("brave")) return null;
  if (lower.includes("chrome") || lower.includes("chromium")) return "chrome";
  return null;
}

type ImageSource = string | { src: string };

const browserIcons: Record<Exclude<BrowserKind, null>, ImageSource> = {
  chrome: chromeIcon,
  firefox: firefoxIcon,
  safari: safariIcon,
};

export interface UseBrowserIconOptions {
  userAgent: string | null;
}

export function useBrowserIcon({ userAgent }: UseBrowserIconOptions) {
  const browser = detectBrowser(userAgent);

  if (!browser) {
    return {
      browser: null,
      iconSrc: null,
      title: null,
    };
  }

  const rawIcon = browserIcons[browser];
  const iconSrc = typeof rawIcon === "string" ? rawIcon : rawIcon.src;
  const title = browser.charAt(0).toUpperCase() + browser.slice(1);

  return {
    browser,
    iconSrc,
    title,
  };
}
