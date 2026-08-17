import { useIntruderStore } from '@/stores/intruder';

export function startIntruderAttack(): void {
  void useIntruderStore.getState().startAttack();
}

export function stopIntruderAttack(): void {
  void useIntruderStore.getState().stopAttack();
}

export const startInvokerAttack = startIntruderAttack;
export const stopInvokerAttack = stopIntruderAttack;
export const stopInvokerUiAttack = stopIntruderAttack;
export const stopIntruderUiAttack = stopIntruderAttack;

