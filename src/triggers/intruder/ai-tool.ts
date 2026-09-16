import { startIntruderAttack } from './ui';

export const INVOKER_AI_TOOL_DEFINITION = {
  name: 'start_invoker_attack',
  description: 'Launch a brute-force or payload injection attack using the Invoker engine.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export async function executeStartInvokerAttackAiTool() {
  startIntruderAttack();
  return 'Invoker attack launched. Configure the payload and target in the Intruder tab.';
}

