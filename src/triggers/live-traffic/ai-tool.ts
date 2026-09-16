import { addTarget, deleteTarget } from './targets';

export const ADD_SCOPE_TARGET_AI_TOOL_DEFINITION = {
  name: 'add_scope_target',
  description: 'Add a target host or domain to the authorized in-scope target list.',
  parameters: {
    type: 'object',
    properties: {
      host: {
        type: 'string',
        description: 'The target hostname, domain, or IP address (e.g. "example.com", "api.target.com", "192.168.1.1").',
      },
      name: {
        type: 'string',
        description: 'Optional friendly label or project name for the target.',
      },
    },
    required: ['host'],
  },
};

export const REMOVE_SCOPE_TARGET_AI_TOOL_DEFINITION = {
  name: 'remove_scope_target',
  description: 'Remove a target host or domain from the in-scope target list.',
  parameters: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'The target ID, hostname, or name to remove from scope.',
      },
    },
    required: ['target'],
  },
};

export async function executeAddScopeTargetAiTool(args: {
  host?: string;
  name?: string;
  target?: string;
  label?: string;
}): Promise<string> {
  const host = (args.host ?? args.target)?.trim();
  if (!host) {
    throw new Error('Target host is required.');
  }

  addTarget({
    host,
    name: (args.name ?? args.label)?.trim() || null,
  });

  return `Added "${host}" to the target scope.`;
}

export async function executeRemoveScopeTargetAiTool(args: {
  target?: string;
  host?: string;
}): Promise<string> {
  const target = (args.target ?? args.host)?.trim();
  if (!target) {
    throw new Error('Target identifier is required.');
  }

  deleteTarget({ targetId: target });
  return `Removed "${target}" from the target scope.`;
}
