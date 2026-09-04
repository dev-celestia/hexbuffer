import type { NucleiFlowNode, NucleiFlowEdge, FlowDiagnostic } from '../types';

export function validateNucleiGraph(
  nodes: NucleiFlowNode[],
  edges: NucleiFlowEdge[]
): FlowDiagnostic[] {
  const diagnostics: FlowDiagnostic[] = [];

  // 1. Root Template Info Check
  const templateInfoNodes = nodes.filter((n) => n.type === 'templateInfo');
  if (templateInfoNodes.length === 0) {
    diagnostics.push({
      id: 'missing-template-info',
      type: 'error',
      message: 'Workflow must have a Template Metadata (templateInfo) root node.',
    });
  } else if (templateInfoNodes.length > 1) {
    diagnostics.push({
      id: 'multiple-template-info',
      type: 'warning',
      nodeId: templateInfoNodes[1].id,
      message: 'Multiple Template Metadata nodes detected. Only the first will be exported.',
    });
  }

  // 2. Request Node Presence Check
  const requestNodes = nodes.filter((n) => n.type === 'requestNode');
  if (requestNodes.length === 0) {
    diagnostics.push({
      id: 'missing-request-node',
      type: 'error',
      message: 'Workflow requires at least one Protocol Request Probe node.',
    });
  }

  // 3. Extracted Variable Names Set
  const extractedVariables = new Set<string>();
  nodes
    .filter((n) => n.type === 'extractorNode')
    .forEach((n) => {
      const name = (n.data as { name?: string }).name;
      if (name) extractedVariables.add(name.trim());
    });

  // Built-in standard Nuclei variables
  const builtInVariables = new Set([
    'BaseURL',
    'RootURL',
    'Hostname',
    'Host',
    'Port',
    'Path',
    'File',
    'Scheme',
    'randstr',
    'rand_int',
    'rand_text_alphanumeric',
  ]);

  // 4. Dangling Variable References in Request Nodes
  requestNodes.forEach((reqNode) => {
    const data = reqNode.data as { path?: string[]; body?: string; headers?: Record<string, string> };
    const contentToInspect = [
      ...(data.path || []),
      data.body || '',
      ...Object.values(data.headers || {}),
    ].join(' ');

    const variableMatches = contentToInspect.matchAll(/\{\{([a-zA-Z0-9_\-]+)\}\}/g);
    for (const match of variableMatches) {
      const varName = match[1];
      if (!builtInVariables.has(varName) && !extractedVariables.has(varName)) {
        diagnostics.push({
          id: `unresolved-var-${reqNode.id}-${varName}`,
          type: 'warning',
          nodeId: reqNode.id,
          message: `Variable "{{${varName}}}" is referenced in request but not produced by any Extractor node or built-in helper.`,
        });
      }
    }
  });

  // 5. Disconnected Nodes Check
  if (nodes.length > 1) {
    const connectedNodeIds = new Set<string>();
    edges.forEach((e) => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });

    nodes.forEach((n) => {
      if (!connectedNodeIds.has(n.id)) {
        diagnostics.push({
          id: `disconnected-node-${n.id}`,
          type: 'info',
          nodeId: n.id,
          message: `Node "${n.type}" is disconnected from the workflow graph.`,
        });
      }
    });
  }

  // 6. Cycle Detection (DFS)
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of adj.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (hasCycle(n.id)) {
        diagnostics.push({
          id: 'cycle-detected',
          type: 'error',
          nodeId: n.id,
          message: 'Cyclic loop detected in workflow execution graph.',
        });
        break;
      }
    }
  }

  return diagnostics;
}
