import { beforeEach, describe, expect, it, vi } from 'vitest';

const addAttackTabMock = vi.fn();
const updateConfigMock = vi.fn();
const clearStartErrorMock = vi.fn();

let mockState = {
  activeTabId: 'tab-1',
  tabs: [
    {
      id: 'tab-1',
      name: 'Test Attack',
      isRunning: false,
      config: {
        name: 'Test Attack',
        mode: 'Sniper',
        base_request: {
          url: 'https://example.com/api',
          method: 'GET',
          headers: {},
          body: '',
          follow_redirects: true,
          max_hops: 10,
        },
      },
    },
  ],
  addAttackTab: addAttackTabMock,
  updateConfig: updateConfigMock,
  clearStartError: clearStartErrorMock,
};

vi.mock('@/stores/intruder', () => ({
  useIntruderStore: {
    getState: () => mockState,
    subscribe: vi.fn(() => vi.fn()),
  },
}));

vi.mock('@/stores/nav', () => ({
  useNavStore: {
    getState: () => ({
      triggerNavBlink: vi.fn(),
      openWindow: vi.fn(),
      focusWindow: vi.fn(),
    }),
  },
}));

vi.mock('@/triggers/scope', () => ({
  assertHostInScope: vi.fn(),
}));

vi.mock('./ui', () => ({
  startIntruderAttack: vi.fn(),
  stopIntruderAttack: vi.fn(),
}));

import {
  executeSendToIntruderAiTool,
  executeStartInvokerAttackAiTool,
} from './ai-tool';
import { assertHostInScope } from '@/triggers/scope';

describe('intruder ai-tool executors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSendToIntruderAiTool', () => {
    it('creates attack tab from rawRequest without logId', async () => {
      const raw = 'POST /login HTTP/1.1\r\nHost: example.com\r\n\r\nuser=test';
      const result = await executeSendToIntruderAiTool({ rawRequest: raw });

      expect(result).toContain('Sent request to Intruder');
      expect(addAttackTabMock).toHaveBeenCalledTimes(1);
      const passedConfig = addAttackTabMock.mock.calls[0][0];
      expect(passedConfig.base_request.method).toBe('POST');
      expect(passedConfig.base_request.body).toBe('user=test');
    });

    it('rejects call if neither logId nor rawRequest is provided', async () => {
      await expect(executeSendToIntruderAiTool({})).rejects.toThrow(
        'Either logId or rawRequest is required to send to Intruder.',
      );
      expect(addAttackTabMock).not.toHaveBeenCalled();
    });
  });

  describe('executeStartInvokerAttackAiTool', () => {
    it('updates attack mode when attack_type is provided', async () => {
      await executeStartInvokerAttackAiTool({ attack_type: 'cluster_bomb' });

      expect(updateConfigMock).toHaveBeenCalledWith({ mode: 'ClusterBomb' });
      expect(assertHostInScope).toHaveBeenCalledWith(
        'https://example.com/api',
        'launch an Intruder attack against',
      );
    });

    it('rejects invalid attack strategy', async () => {
      await expect(
        executeStartInvokerAttackAiTool({ attack_type: 'invalid_mode' }),
      ).rejects.toThrow('Invalid attack strategy "invalid_mode"');
    });

    it('fails closed when base_request url is invalid or missing', async () => {
      const originalTab = mockState.tabs[0];
      mockState.tabs = [
        {
          ...originalTab,
          config: {
            ...originalTab.config,
            base_request: {
              ...originalTab.config.base_request,
              url: 'not-a-valid-http-url',
            },
          },
        },
      ];

      await expect(executeStartInvokerAttackAiTool({})).rejects.toThrow(
        'Target must be an absolute http(s) URL',
      );

      mockState.tabs = [originalTab];
    });
  });
});
