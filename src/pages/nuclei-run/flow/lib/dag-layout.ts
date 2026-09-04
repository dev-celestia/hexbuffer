import type { NucleiFlowNode, NucleiFlowEdge } from '../types';

interface LayoutOptions {
  direction?: 'TB' | 'LR';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

// ponytail: Lightweight deterministic hierarchical DAG layout without heavy external libraries
export function calculateDagLayout(
  nodes: NucleiFlowNode[],
  edges: NucleiFlowEdge[],
  options: LayoutOptions = {}
): NucleiFlowNode[] {
  if (nodes.length === 0) return [];

  const nodeWidth = options.nodeWidth ?? 290;
  const nodeHeight = options.nodeHeight ?? 170;
  const rankSep = options.rankSep ?? 90;
  const nodeSep = options.nodeSep ?? 50;

  // Build adjacency graph
  const nodeMap = new Map<string, NucleiFlowNode>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Identify root nodes (inDegree === 0)
  const ranks = new Map<string, number>();
  const queue: string[] = [];

  // Prefer templateInfo as rank 0
  nodes.forEach((n) => {
    if (n.type === 'templateInfo' || inDegree.get(n.id) === 0) {
      ranks.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    ranks.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  // Assign ranks using BFS
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentRank = ranks.get(currentId) || 0;

    for (const neighbor of adj.get(currentId) || []) {
      const existingRank = ranks.get(neighbor);
      const newRank = currentRank + 1;
      if (existingRank === undefined || newRank > existingRank) {
        ranks.set(neighbor, newRank);
        queue.push(neighbor);
      }
    }
  }

  // Ensure all unvisited nodes get assigned a rank
  nodes.forEach((n) => {
    if (!ranks.has(n.id)) {
      ranks.set(n.id, 1);
    }
  });

  // Group nodes by rank
  const rankGroups = new Map<number, NucleiFlowNode[]>();
  nodes.forEach((n) => {
    const r = ranks.get(n.id) || 0;
    if (!rankGroups.has(r)) {
      rankGroups.set(r, []);
    }
    rankGroups.get(r)!.push(n);
  });

  // Calculate coordinates
  const updatedNodes: NucleiFlowNode[] = [];
  const maxRank = Math.max(...Array.from(rankGroups.keys()), 0);

  for (let r = 0; r <= maxRank; r++) {
    const group = rankGroups.get(r) || [];
    const totalGroupWidth = group.length * nodeWidth + (group.length - 1) * nodeSep;
    const startX = -totalGroupWidth / 2 + nodeWidth / 2;

    group.forEach((node, idx) => {
      const x = startX + idx * (nodeWidth + nodeSep);
      const y = r * (nodeHeight + rankSep) + 40;

      updatedNodes.push({
        ...node,
        position: { x, y },
      });
    });
  }

  return updatedNodes;
}
