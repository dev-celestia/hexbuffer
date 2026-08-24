import type React from 'react';
import { TriggerNode } from '../nodes/trigger-node';
import { ConditionNode } from '../nodes/condition-node';
import { ActionNode } from '../nodes/action-node';
import { DeletableEdge } from '../components/deletable-edge';

export const NODE_TYPES = {
  'trigger:scan-completed': TriggerNode,
  'trigger:scheduled': TriggerNode,
  'trigger:manual': TriggerNode,
  'trigger:browser-page-crawled': TriggerNode,
  'trigger:intercept-request': TriggerNode,
  'trigger:websocket-message': TriggerNode,
  'trigger:port-scan-result': TriggerNode,
  'trigger:live-traffic-captured': TriggerNode,
  'condition:status-code': ConditionNode,
  'condition:url-contains': ConditionNode,
  'condition:body-contains': ConditionNode,
  'condition:header-exists': ConditionNode,
  'condition:severity': ConditionNode,
  'condition:ai-confidence': ConditionNode,
  'condition:method': ConditionNode,
  'condition:content-type': ConditionNode,
  'condition:response-size': ConditionNode,
  'condition:crawl-status': ConditionNode,
  'condition:grep-match': ConditionNode,
  'condition:port-open': ConditionNode,
  'action:send-to-repeater': ActionNode,
  'action:ai-analyze': ActionNode,
  'action:create-finding': ActionNode,
  'action:add-to-report': ActionNode,
  'action:send-webhook': ActionNode,
  'action:show-notification': ActionNode,
  'action:run-script': ActionNode,
  'action:start-crawl': ActionNode,
  'action:stop-crawl': ActionNode,
  'action:send-to-intercept': ActionNode,
  'action:start-invoker': ActionNode,
  'action:port-scan': ActionNode,
  'action:encode-decode': ActionNode,
  'action:hash-data': ActionNode,
  'action:export-json': ActionNode,
  'action:connect-cdp': ActionNode,
};

export const EDGE_TYPES = {
  deletable: DeletableEdge,
};

export const CONNECTION_LINE_STYLE: React.CSSProperties = {
  stroke: '#00c950',
  strokeWidth: 3,
};
