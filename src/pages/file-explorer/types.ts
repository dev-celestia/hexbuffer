export interface R2Item {
  type: 'folder' | 'file';
  name: string;
  key: string;
  size?: number;
  lastModified?: Date;
}

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  customEndpointUrl?: string;
}

export interface WordlistManifestItem {
  href: string;
  lines: number;
  name: string;
  tags: string[];
}

export type WordlistDownloadStatus = 'idle' | 'downloading' | 'installed' | 'error';

export interface WordlistItemWithStatus extends WordlistManifestItem {
  id: string;
  status: WordlistDownloadStatus;
  localPath?: string;
  fileSize?: number;
  downloadProgress?: number;
  error?: string;
}

export interface WordlistCategoryTag {
  name: string;
  count: number;
  installedCount: number;
}
