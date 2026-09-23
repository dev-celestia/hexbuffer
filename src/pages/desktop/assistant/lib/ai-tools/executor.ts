import {
  executeSendToRepeaterAiTool,
  executeCreateCollectionAiTool,
  executeCreateFolderAiTool,
  executeCreateEndpointAiTool,
  executeSendRepeaterRequestAiTool,
} from './repeater';
import {
  executeStartInvokerAttackAiTool,
  executeStopInvokerAttackAiTool,
  executeSendToIntruderAiTool,
} from './intruder';
import {
  executeToggleInterceptAiTool,
  executeForwardPausedRequestAiTool,
  executeDropPausedRequestAiTool,
} from './intercept';
import {
  executeTriggerScanAiTool,
  executeToggleBrowserCrawlAiTool,
  executeStopBrowserCrawlAiTool,
} from './browser';
import { executeNavigateToAppAiTool } from './navigation';
import {
  executeAddScopeTargetAiTool,
  executeRemoveScopeTargetAiTool,
} from './live-traffic';
import {
  executeListJobsAiTool,
  executeGetJobStatusAiTool,
  executeCancelJobAiTool,
} from './jobs';
import {
  executeQueryHttpHistoryAiTool,
  executeGetHttpRequestDetailAiTool,
} from './http-history';
import {
  executeTriggerNucleiScanAiTool,
  executeStopNucleiScanAiTool,
  executeGetNucleiStatusAiTool,
  executeGetNucleiFindingsAiTool,
} from './nuclei';
import { addTrackedAction, completeTrackedAction } from './tracker';

async function dispatchToolExecution(toolName: string, args: Record<string, any>): Promise<any> {
  switch (toolName) {
    // Repeater Tools
    case 'send_to_repeater':
      return executeSendToRepeaterAiTool(args);

    case 'create_collection':
      return executeCreateCollectionAiTool(args);

    case 'create_folder':
      return executeCreateFolderAiTool(args);

    case 'create_endpoint':
      return executeCreateEndpointAiTool(args);

    case 'send_repeater_request':
      return executeSendRepeaterRequestAiTool();

    // Intruder Tools
    case 'start_invoker_attack':
      return executeStartInvokerAttackAiTool();

    case 'stop_invoker_attack':
      return executeStopInvokerAttackAiTool();

    case 'send_to_intruder':
      return executeSendToIntruderAiTool(args);

    // Intercept Queue Tools
    case 'toggle_intercept':
      return executeToggleInterceptAiTool(args);

    case 'forward_paused_request':
      return executeForwardPausedRequestAiTool(args);

    case 'drop_paused_request':
      return executeDropPausedRequestAiTool();

    // Browser Tools
    case 'trigger_scan':
      return executeTriggerScanAiTool(args);

    case 'toggle_browser_crawl':
      return executeToggleBrowserCrawlAiTool();

    case 'stop_browser_crawl':
      return executeStopBrowserCrawlAiTool();

    // Navigation & Target Scope Tools
    case 'navigate_to_app':
      return executeNavigateToAppAiTool(args);

    case 'add_scope_target':
      return executeAddScopeTargetAiTool(args);

    case 'remove_scope_target':
      return executeRemoveScopeTargetAiTool(args);

    // Background Job Tools
    case 'list_jobs':
      return executeListJobsAiTool(args);

    case 'get_job_status':
      return executeGetJobStatusAiTool(args);

    case 'cancel_job':
      return executeCancelJobAiTool(args);

    // HTTP History Tools
    case 'query_http_history':
      return executeQueryHttpHistoryAiTool(args);

    case 'get_http_request_detail':
      return executeGetHttpRequestDetailAiTool(args);

    // Nuclei Scanner Tools
    case 'trigger_nuclei_scan':
      return executeTriggerNucleiScanAiTool(args);

    case 'stop_nuclei_scan':
      return executeStopNucleiScanAiTool();

    case 'get_nuclei_status':
      return executeGetNucleiStatusAiTool();

    case 'get_nuclei_findings':
      return executeGetNucleiFindingsAiTool(args);

    default:
      throw new Error(`Unknown AI Tool capability: ${toolName}`);
  }
}

/**
 * Executes a tool capability directly using Hexbuffer frontend triggers and tracks progress
 */
export async function executeAiToolCall(toolName: string, args: Record<string, any>): Promise<any> {
  const actionId = addTrackedAction(toolName, args);
  try {
    const result = await dispatchToolExecution(toolName, args);
    completeTrackedAction(actionId, false);
    return result;
  } catch (error) {
    completeTrackedAction(actionId, true);
    throw error;
  }
}
