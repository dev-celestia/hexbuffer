import { runTerminalCommand } from '@/triggers/terminal';

export const TERMINAL_AI_TOOL_DEFINITION = {
  name: 'run_terminal_command',
  description: 'Execute a shell command inside the Apprecon integrated terminal.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command string to run in the terminal',
      },
    },
    required: ['command'],
  },
};

export function executeRunTerminalCommandAiTool(args: Record<string, any>) {
  runTerminalCommand(args.command);
  return { status: 'success', tool: 'run_terminal_command', command: args.command };
}
