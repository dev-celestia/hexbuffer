import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ui', () => ({
  forwardPaused: vi.fn(),
  dropPaused: vi.fn(),
}));
const toggleInterceptMock = vi.fn();
vi.mock('@/pages/intercept/state/intercept-store', () => ({
  useInterceptStore: {
    getState: vi.fn(() => ({
      toggleIntercept: toggleInterceptMock,
      requests: [],
      selectedRequestId: null,
    })),
  },
}));

import { forwardPaused } from './ui';
import { executeForwardPausedRequestAiTool } from './ai-tool';
import { useInterceptStore } from '@/pages/intercept/state/intercept-store';

describe('forward_paused_request bounded wait', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(forwardPaused).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forwards immediately when a request is already paused', async () => {
    vi.mocked(forwardPaused).mockResolvedValue(true);

    await expect(executeForwardPausedRequestAiTool({})).resolves.toBe(
      'Forwarded the intercepted HTTP request.',
    );
    expect(forwardPaused).toHaveBeenCalledTimes(1);
  });

  it('does not wait by default and advertises the waitSeconds option', async () => {
    vi.mocked(forwardPaused).mockResolvedValue(false);

    const result = await executeForwardPausedRequestAiTool({});
    expect(result).toContain('Retry with waitSeconds');
    expect(forwardPaused).toHaveBeenCalledTimes(1);
  });

  it('polls until a request arrives within the wait window', async () => {
    vi.mocked(forwardPaused)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    const promise = executeForwardPausedRequestAiTool({ waitSeconds: 10 });
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);

    await expect(promise).resolves.toBe('Forwarded the intercepted HTTP request.');
    expect(forwardPaused).toHaveBeenCalledTimes(3);
  });

  it('gives up at the deadline and clamps the window to 60 seconds', async () => {
    vi.mocked(forwardPaused).mockResolvedValue(false);

    const promise = executeForwardPausedRequestAiTool({ waitSeconds: 10_000 });
    await vi.advanceTimersByTimeAsync(60_000);

    const result = await promise;
    expect(result).toContain('within 60 seconds');
  });

  it('treats a non-numeric waitSeconds as no wait', async () => {
    vi.mocked(forwardPaused).mockResolvedValue(false);

    const result = await executeForwardPausedRequestAiTool({ waitSeconds: 'soon' });
    expect(result).toContain('No paused request');
    expect(forwardPaused).toHaveBeenCalledTimes(1);
  });
});

describe('toggle_intercept boolean parsing', () => {
  it('correctly disables interception when passed string "false"', async () => {
    toggleInterceptMock.mockReset();
    const { executeToggleInterceptAiTool } = await import('./ai-tool');
    const result = await executeToggleInterceptAiTool({ enabled: 'false' });

    expect(toggleInterceptMock).toHaveBeenCalledWith(false);
    expect(result).toContain('disabled');
  });

  it('correctly enables interception when passed boolean true', async () => {
    toggleInterceptMock.mockReset();
    const { executeToggleInterceptAiTool } = await import('./ai-tool');
    const result = await executeToggleInterceptAiTool({ enabled: true });

    expect(toggleInterceptMock).toHaveBeenCalledWith(true);
    expect(result).toContain('enabled');
  });
});