import type { Node, Edge } from '@xyflow/react';
import type { Severity, ProtocolType } from '../types';

export type { Severity, ProtocolType };

export type NucleiNodeType =
  | 'templateInfo'
  | 'requestNode'
  | 'extractorNode'
  | 'matcherNode'
  | 'flowNode';

export type NucleiEdgeType =
  | 'default'
  | 'condition-true'
  | 'condition-false'
  | 'variable-pipe';

// 1. Template Metadata Node Data
export interface TemplateInfoNodeData {
  id: string;
  name: string;
  author: string;
  severity: Severity;
  description: string;
  reference: string[];
  tags: string[];
  protocol: ProtocolType;
  metadata?: Record<string, string>;
  remmediation?: string;
  [key: string]: unknown;
}

// 2. Request Node Data
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestNodeData {
  stepId: string;
  protocol: ProtocolType;
  method: HttpMethod;
  path: string[];
  headers?: Record<string, string>;
  body?: string;
  raw?: string[];
  stopAtFirstMatch?: boolean;
  followRedirects?: boolean;
  unsafe?: boolean;
  payloads?: Record<string, string[]>;
  threads?: number;
  [key: string]: unknown;
}

// 3. Extractor Node Data
export type ExtractorType = 'regex' | 'json' | 'xpath' | 'dsl' | 'kval';
export type ExtractorPart = 'body' | 'header' | 'all' | 'response';

export interface ExtractorNodeData {
  name: string;
  type: ExtractorType;
  part: ExtractorPart;
  internal?: boolean;
  regex?: string[];
  json?: string[];
  xpath?: string[];
  dsl?: string[];
  kval?: string[];
  group?: number;
  [key: string]: unknown;
}

// 4. Matcher Node Data
export type MatcherType =
  | 'status'
  | 'word'
  | 'regex'
  | 'binary'
  | 'dsl'
  | 'size'
  | 'time';

export type MatcherCondition = 'and' | 'or';
export type MatcherPart = 'body' | 'header' | 'all' | 'status' | 'response';

export interface MatcherNodeData {
  name?: string;
  type: MatcherType;
  part: MatcherPart;
  condition: MatcherCondition;
  negative?: boolean;
  status?: number[];
  words?: string[];
  regex?: string[];
  dsl?: string[];
  size?: number[];
  internal?: boolean;
  caseInsensitive?: boolean;
  [key: string]: unknown;
}

// 5. Flow Node Data (Nuclei v3 Flow Engine)
export interface FlowNodeData {
  flowCode: string;
  description?: string;
  stepDependencies?: string[];
  [key: string]: unknown;
}

export type NucleiFlowNodeData =
  | ({ nodeType: 'templateInfo' } & TemplateInfoNodeData)
  | ({ nodeType: 'requestNode' } & RequestNodeData)
  | ({ nodeType: 'extractorNode' } & ExtractorNodeData)
  | ({ nodeType: 'matcherNode' } & MatcherNodeData)
  | ({ nodeType: 'flowNode' } & FlowNodeData);

export type NucleiFlowNode = Node<NucleiFlowNodeData, NucleiNodeType>;
export type NucleiFlowEdge = Edge<{ edgeType?: NucleiEdgeType; label?: string }>;

export interface FlowDiagnostic {
  id: string;
  type: 'error' | 'warning' | 'info';
  nodeId?: string;
  message: string;
  field?: string;
}

export interface PaletteItem {
  type: NucleiNodeType;
  title: string;
  description: string;
  category: 'core' | 'probe' | 'analysis' | 'orchestration';
  icon: string;
}
