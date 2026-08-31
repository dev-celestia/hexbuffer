import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

export const LOCAL_STORAGE_DIR_NAME = 'Hexbuffer Files';

export interface SavedLocalFile {
  filePath: string;
  srcUrl: string;
  relativePath: string;
  fileName: string;
}

/**
 * Saves Base64 content or text to the local File Explorer directory (`Hexbuffer Files/<subfolder>/<filename>`)
 */
export async function saveToFileExplorer(
  data: string,
  preferredName?: string,
  subfolder = 'files'
): Promise<SavedLocalFile> {
  try {
    const docDir = await documentDir();
    const targetFolder = await join(docDir, LOCAL_STORAGE_DIR_NAME, subfolder);

    const folderExists = await exists(targetFolder);
    if (!folderExists) {
      await mkdir(targetFolder, { recursive: true });
    }

    const isBase64 = data.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(data.slice(0, 100).trim());
    const isImage = data.startsWith('data:image/') || (preferredName && /\.(png|jpe?g|webp|gif|svg)$/i.test(preferredName));

    let fileName = preferredName;
    let bytes: Uint8Array;

    if (isImage || (isBase64 && !data.includes('\n') && data.length > 50)) {
      const cleanBase64 = data
        .replace(/^data:[^;]+;base64,/, '')
        .trim();
      
      const binaryString = atob(cleanBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      if (!fileName) {
        fileName = `file-${Date.now()}.${isImage ? 'png' : 'bin'}`;
      }
    } else {
      // Plain text or UTF-8 content
      const encoder = new TextEncoder();
      bytes = encoder.encode(data);
      if (!fileName) {
        fileName = `output-${Date.now()}.txt`;
      }
    }

    const fullPath = await join(targetFolder, fileName);
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
      relativePath: `${LOCAL_STORAGE_DIR_NAME}/${subfolder}/${fileName}`,
      fileName,
    };
  } catch (err) {
    console.warn('Failed to save to local file explorer:', err);
    return {
      filePath: '',
      srcUrl: data,
      relativePath: preferredName || 'file',
      fileName: preferredName || 'file',
    };
  }
}
