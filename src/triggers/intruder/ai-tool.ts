import { startIntruderAttack } from './ui';

export const INTRUDER_AI_TOOL_DEFINITION = {
  name: 'start_intruder_attack',
  description: 'Launch a brute-force or payload injection attack using the Intruder engine.',
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

export const INVOKER_AI_TOOL_DEFINITION = INTRUDER_AI_TOOL_DEFINITION;

export async function executeStartIntruderAttackAiTool(args: Record<string, any>) {
  startIntruderAttack();
  const strategy = args?.attack_type ? ` (strategy: ${args.attack_type})` : '';
  return `Invoker attack launched${strategy}. Configure the payload and target in the Intruder tab.`;
}

export const executeStartInvokerAttackAiTool = executeStartIntruderAttackAiTool;

