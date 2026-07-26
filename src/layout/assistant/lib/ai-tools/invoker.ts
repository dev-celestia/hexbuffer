import { startInvokerAttack } from '@/triggers/invoker';

export const INVOKER_AI_TOOL_DEFINITION = {
  name: 'start_invoker_attack',
  description: 'Launch a brute-force or payload injection attack using the Invoker engine.',
  parameters: {
    type: 'object',
    properties: {
      attack_type: {
        type: 'string',
        description: 'Attack strategy (sniper, battering_ram, pitchfork, cluster_bomb)',
      },
    },
  },
};

export function executeStartInvokerAttackAiTool(_args: Record<string, any>) {
  startInvokerAttack();
  return { status: 'success', tool: 'start_invoker_attack' };
}
