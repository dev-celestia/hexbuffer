import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

/**
 * Normalizes a route or tool name into a safe Tauri window label and query target.
 * e.g. "/http-history" -> "http-history"
 */
export function normalizeSubAppTarget(targetOrHref: string): string {
  return targetOrHref
    .replace(/^\//, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-");
}

/**
 * Opens a tool in a dedicated, independent sub-window.
 * If the sub-window is already open, it is brought forward and focused.
 */
export async function openSubAppWindow(targetOrHref: string, title?: string): Promise<void> {
  const cleanTarget = normalizeSubAppTarget(targetOrHref);
  const windowLabel = `subapp-${cleanTarget}`;

  try {
    const existing = await WebviewWindow.getByLabel(windowLabel);
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
    }

    const subWindow = new WebviewWindow(windowLabel, {
      url: `index.html?target=${cleanTarget}`,
      title: title ? `${title} — Hexbuffer` : "Hexbuffer",
      width: 1200,
      height: 800,
      minWidth: 750,
      minHeight: 520,
      decorations: true,
      titleBarStyle: "Overlay",
      hiddenTitle: true,
      transparent: true,
    });

    subWindow.once("tauri://created", () => {
      subWindow.show();
      subWindow.setFocus();
    });

    subWindow.once("tauri://error", (err) => {
      console.error(`Failed to create sub-app window [${windowLabel}]:`, err);
    });
  } catch (err) {
    console.error(`Error opening sub-app window [${windowLabel}]:`, err);
  }
}
