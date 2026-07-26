import { MarkerType, type Connection } from '@xyflow/react';
import type { AutomationEdge } from '../types';

export const AUTOMATION_EDGE_STYLE = {
  stroke: 'var(--primary)',
  strokeWidth: 1,
};

export const AUTOMATION_MARKER_END = {
  type: MarkerType.ArrowClosed,
  color: 'var(--primary)',
  width: 20,
  height: 20,
};

export const AUTOMATION_DEFAULT_EDGE_OPTIONS = {
  type: 'deletable' as const,
  animated: true,
  selectable: true,
  style: AUTOMATION_EDGE_STYLE,
  interactionWidth: 20,
  markerEnd: AUTOMATION_MARKER_END,
};

export function buildAutomationEdge(edge: Partial<AutomationEdge> & Pick<AutomationEdge, 'source' | 'target'>): AutomationEdge {
  return {
    ...AUTOMATION_DEFAULT_EDGE_OPTIONS,
    ...edge,
    style: {
      ...(edge.style ?? {}),
      ...AUTOMATION_EDGE_STYLE,
    },
    markerEnd: {
      ...AUTOMATION_MARKER_END,
      ...((edge.markerEnd as object | undefined) ?? {}),
    },
    interactionWidth: edge.interactionWidth ?? AUTOMATION_DEFAULT_EDGE_OPTIONS.interactionWidth,
  } as AutomationEdge;
}

export function buildAutomationEdgeFromConnection(connection: Connection): AutomationEdge {
  return buildAutomationEdge({
    ...connection,
    id: crypto.randomUUID(),
  });
}

export function keepOneAutomationEdgePerHandle(edges: AutomationEdge[] = []): AutomationEdge[] {
  const usedSourceHandles = new Set<string>();
  const usedTargetHandles = new Set<string>();
  const nextEdges: AutomationEdge[] = [];

  for (const edge of edges) {
    const sourceKey = `${edge.source}:${edge.sourceHandle ?? 'default'}`;
    const targetKey = `${edge.target}:${edge.targetHandle ?? 'default'}`;

    if (usedSourceHandles.has(sourceKey) || usedTargetHandles.has(targetKey)) {
      continue;
    }

    usedSourceHandles.add(sourceKey);
    usedTargetHandles.add(targetKey);
    nextEdges.push(edge);
  }

  return nextEdges;
}

export function normalizeAutomationEdges(edges: AutomationEdge[] = []): AutomationEdge[] {
  return keepOneAutomationEdgePerHandle(edges.map((edge) => buildAutomationEdge(edge)));
}
