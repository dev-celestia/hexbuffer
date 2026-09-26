import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => invokeMock(...args),
}));

const startProxyMock = vi.fn();
vi.mock('@/stores/app', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      proxyStatus: 'disconnected',
      proxyDefaultPort: 8080,
      startProxy: startProxyMock,
    })),
  },
}));

const updateSetupMock = vi.fn();
const startCrawlMock = vi.fn();
vi.mock('@/stores/browser-automation', () => ({
  useBrowserAutomationStore: {
    getState: vi.fn(() => ({
      updateSetup: updateSetupMock,
      startCrawl: startCrawlMock,
      pauseCrawl: vi.fn(),
      resumeCrawl: vi.fn(),
      stopCrawl: vi.fn(),
    })),
  },
}));

const triggerNavBlinkMock = vi.fn();
vi.mock('@/stores/nav', () => ({
  useNavStore: {
    getState: vi.fn(() => ({
      triggerNavBlink: triggerNavBlinkMock,
    })),
  },
}));

import { triggerScan } from './crawl';

describe('triggerScan proxy management and execution', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    startProxyMock.mockReset();
    updateSetupMock.mockReset();
    startCrawlMock.mockReset();
    triggerNavBlinkMock.mockReset();
  });

  it('starts proxy using app store when proxy is not currently running', async () => {
    invokeMock.mockResolvedValueOnce({ running: false, port: null, connections: 0 });
    startProxyMock.mockResolvedValueOnce(undefined);
    startCrawlMock.mockResolvedValueOnce(undefined);

    await triggerScan({ url: 'https://example.com', maxDepth: 2, maxPages: 50, headless: true });

    expect(invokeMock).toHaveBeenCalledWith('get_proxy_status');
    expect(startProxyMock).toHaveBeenCalledTimes(1);
    expect(updateSetupMock).toHaveBeenCalledWith({
      targetUrl: 'https://example.com',
      maxDepth: 2,
      maxPages: 50,
    });
    expect(startCrawlMock).toHaveBeenCalledWith(true);
    expect(triggerNavBlinkMock).toHaveBeenCalledWith('/browser');
  });

  it('skips starting proxy when proxy is already running', async () => {
    invokeMock.mockResolvedValueOnce({ running: true, port: 8080, connections: 1 });
    startCrawlMock.mockResolvedValueOnce(undefined);

    await triggerScan({ url: 'https://example.com' });

    expect(invokeMock).toHaveBeenCalledWith('get_proxy_status');
    expect(startProxyMock).not.toHaveBeenCalled();
    expect(startCrawlMock).toHaveBeenCalledWith(true);
  });

  it('propagates error when proxy fails to start and does not launch crawl', async () => {
    invokeMock.mockResolvedValueOnce({ running: false, port: null, connections: 0 });
    startProxyMock.mockRejectedValueOnce(new Error('Port 8080 already in use'));

    await expect(triggerScan({ url: 'https://example.com' })).rejects.toThrow(
      'Port 8080 already in use',
    );

    expect(startCrawlMock).not.toHaveBeenCalled();
  });
});
