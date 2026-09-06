import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

export const LOCAL_STORAGE_DIR_NAME = 'Hexbuffer Files';

/**
 * Saves a Base64 string directly to the local File Explorer directory (Hexbuffer Files/scratchpads)
 * and returns the local file path / webview asset URL so the note only stores clean file links
 * rather than heavy Base64 strings.
 */
export async function saveBase64ToLocalExplorer(
  base64Data: string,
  preferredName = `scratchpad-${Date.now()}.png`,
  subfolder = 'scratchpads'
): Promise<{ filePath: string; srcUrl: string; relativePath: string }> {
  try {
    const docDir = await documentDir();
    const targetFolder = await join(docDir, LOCAL_STORAGE_DIR_NAME, subfolder);

    const folderExists = await exists(targetFolder);
    if (!folderExists) {
      await mkdir(targetFolder, { recursive: true });
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fullPath = await join(targetFolder, preferredName);
    await writeFile(fullPath, bytes);

    let srcUrl = '';
    try {
      srcUrl = convertFileSrc(fullPath);
    } catch {
      srcUrl = fullPath;
    }

    return {
      filePath: fullPath,
      srcUrl: srcUrl || fullPath,
      relativePath: `${LOCAL_STORAGE_DIR_NAME}/${subfolder}/${preferredName}`,
    };
  } catch (err) {
    console.warn('Failed to save to local file explorer (using data url fallback):', err);
    return {
      filePath: '',
      srcUrl: base64Data,
      relativePath: preferredName,
    };
  }
}
