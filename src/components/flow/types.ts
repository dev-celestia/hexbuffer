import type React from 'react';
import type { BackgroundVariant, Edge, Node, NodeProps } from '@xyflow/react';

export type FlowNodeVariant =
  | 'default'
  | 'trigger'
  | 'action'
  | 'condition'
  | 'warning'
  | 'destructive';

export type FlowNodeState = 'idle' | 'running' | 'success' | 'warning' | 'error';

export type FlowHandleVariant =
  | 'default'
  | 'trigger'
  | 'action'
  | 'condition'
  | 'success'
  | 'destructive';

export interface FlowNodeBaseData extends Record<string, unknown> {
  label?: string;
  description?: string;
  iconName?: string;
  status?: FlowNodeState;
  statusMessage?: string;
}

export interface FlowCommandHelpItem {
  key: string;
  label: string;
}

export interface FlowCanvasBaseProps<NodeType extends Node = Node, EdgeType extends Edge = Edge> {
  nodes?: NodeType[];
  edges?: EdgeType[];
  nodeTypes?: Record<string, React.ComponentType<NodeProps>>;
  edgeTypes?: Record<string, React.ComponentType<any>>;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  showHelpBadge?: boolean;
  backgroundVariant?: BackgroundVariant;
  enableSpacePan?: boolean;
  emptyState?: React.ReactNode;
  helpItems?: FlowCommandHelpItem[];
  className?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
}
