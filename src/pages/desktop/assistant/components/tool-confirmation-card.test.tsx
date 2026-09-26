// @vitest-environment jsdom
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolConfirmationCard } from './tool-confirmation-card';
import * as confirmationModule from '../lib/ai-tools/confirmation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ToolConfirmationCard', () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
      root = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    vi.restoreAllMocks();
  });

  it('renders confirmation card with tool label and action buttons', async () => {
    const confirmation: confirmationModule.PendingToolConfirmation = {
      id: 'call-1',
      token: 'tok-1',
      toolName: 'start_invoker_attack',
      arguments: { attack_type: 'sniper' },
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    };

    await act(async () => {
      root!.render(<ToolConfirmationCard confirmation={confirmation} />);
    });

    expect(container?.textContent).toContain('Launch an Invoker attack');
    expect(container?.textContent).toContain('Review parameters before approving:');

    const buttons = container?.querySelectorAll('button') ?? [];
    const approveBtn = Array.from(buttons).find((b) => b.textContent?.includes('Approve'));
    const denyBtn = Array.from(buttons).find((b) => b.textContent?.includes('Deny'));

    expect(approveBtn).toBeDefined();
    expect(denyBtn).toBeDefined();
    expect(approveBtn?.disabled).toBe(false);
  });

  it('calls approveToolConfirmation on clicking Approve', async () => {
    const approveSpy = vi.spyOn(confirmationModule, 'approveToolConfirmation').mockResolvedValue();

    const confirmation: confirmationModule.PendingToolConfirmation = {
      id: 'call-2',
      token: 'tok-2',
      toolName: 'trigger_scan',
      arguments: { url: 'https://example.com' },
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    };

    await act(async () => {
      root!.render(<ToolConfirmationCard confirmation={confirmation} />);
    });

    const buttons = container?.querySelectorAll('button') ?? [];
    const approveBtn = Array.from(buttons).find((b) => b.textContent?.includes('Approve'));

    await act(async () => {
      approveBtn?.click();
    });

    expect(approveSpy).toHaveBeenCalledWith('call-2');
  });

  it('calls denyToolConfirmation on clicking Deny', async () => {
    const denySpy = vi.spyOn(confirmationModule, 'denyToolConfirmation').mockResolvedValue();

    const confirmation: confirmationModule.PendingToolConfirmation = {
      id: 'call-3',
      token: 'tok-3',
      toolName: 'trigger_scan',
      arguments: { url: 'https://example.com' },
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    };

    await act(async () => {
      root!.render(<ToolConfirmationCard confirmation={confirmation} />);
    });

    const buttons = container?.querySelectorAll('button') ?? [];
    const denyBtn = Array.from(buttons).find((b) => b.textContent?.includes('Deny'));

    await act(async () => {
      denyBtn?.click();
    });

    expect(denySpy).toHaveBeenCalledWith('call-3');
  });

  it('renders expired state and disables Approve when confirmation has expired', async () => {
    const confirmation: confirmationModule.PendingToolConfirmation = {
      id: 'call-expired',
      token: 'tok-4',
      toolName: 'start_invoker_attack',
      arguments: {},
      createdAt: Date.now() - 100_000,
      expiresAt: Date.now() - 10_000, // already expired
    };

    await act(async () => {
      root!.render(<ToolConfirmationCard confirmation={confirmation} />);
    });

    expect(container?.textContent).toContain('This confirmation has expired and can no longer be executed.');

    const buttons = container?.querySelectorAll('button') ?? [];
    const approveBtn = Array.from(buttons).find((b) => b.textContent?.includes('Expired'));
    expect(approveBtn).toBeDefined();
    expect(approveBtn?.disabled).toBe(true);
  });
});
