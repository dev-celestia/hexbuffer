import type React from 'react';
import { MarkerType } from '@xyflow/react';
import { StepNode } from '../nodes/step-node';

export const REGRESSION_NODE_TYPES = {
  regressionStep: StepNode,
};

export const REGRESSION_DEFAULT_EDGE_OPTIONS = {
  animated: true,
  selectable: false,
  style: {
    stroke: 'var(--primary)',
    strokeWidth: 1.5,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: 'var(--primary)',
    width: 18,
    height: 18,
  },
};

export const REGRESSION_CONNECTION_LINE_STYLE: React.CSSProperties = {
  stroke: 'var(--primary)',
  strokeWidth: 2,
};
