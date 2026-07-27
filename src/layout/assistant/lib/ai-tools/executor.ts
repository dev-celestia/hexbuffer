import {
  executeSendToRepeaterAiTool,
  executeCreateCollectionAiTool,
  executeCreateFolderAiTool,
  executeCreateEndpointAiTool,
} from './repeater';
import { executeStartInvokerAttackAiTool } from './invoker';
import { executeToggleInterceptAiTool } from './intercept';
import { executeTriggerScanAiTool } from './browser';
import { executeRunTerminalCommandAiTool } from './terminal';
import { executeWriteDocumentAiTool } from './documents';
import { addTrackedAction, completeTrackedAction } from './tracker';

async function dispatchToolExecution(toolName: string, args: Record<string, any>): Promise<any> {
  switch (toolName) {
    case 'send_to_repeater':
      return executeSendToRepeaterAiTool(args);

    case 'create_collection':
      return executeCreateCollectionAiTool(args);

    case 'create_folder':
      return executeCreateFolderAiTool(args);

    case 'create_endpoint':
      return executeCreateEndpointAiTool(args);

    case 'start_invoker_attack':
      return executeStartInvokerAttackAiTool(args);

    case 'toggle_intercept':
      return executeToggleInterceptAiTool(args);

    case 'trigger_scan':
      return executeTriggerScanAiTool(args);

    case 'run_terminal_command':
      return executeRunTerminalCommandAiTool(args);

    case 'write_document':
      return executeWriteDocumentAiTool(args);

    default:
      throw new Error(`Unknown AI Tool capability: ${toolName}`);
  }
}

/**
 * Executes a tool capability directly using Apprecon frontend triggers and tracks progress
 */
export async function executeAiToolCall(toolName: string, args: Record<string, any>): Promise<any> {
  const actionId = addTrackedAction(toolName);
  try {
    const result = await dispatchToolExecution(toolName, args);
    completeTrackedAction(actionId, false);
    return result;
  } catch (error) {
    completeTrackedAction(actionId, true);
    throw error;
  }
}
