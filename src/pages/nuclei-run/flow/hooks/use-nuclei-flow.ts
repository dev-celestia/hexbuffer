import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type {
  NucleiFlowNode,
  NucleiFlowEdge,
  FlowDiagnostic,
} from '../types';
import { calculateDagLayout } from '../lib/dag-layout';
import { validateNucleiGraph } from '../lib/graph-validator';
import { nucleiYamlToGraph } from '../lib/ast-translator';

interface UseNucleiFlowProps {
  initialYaml?: string;
  executionStatus?: 'idle' | 'running' | 'completed' | 'error';
  hasFindings?: boolean;
}

// ponytail: Lean hook for read-only visualization of Nuclei template DAG topology
export function useNucleiFlow({ initialYaml }: UseNucleiFlowProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NucleiFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<NucleiFlowEdge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<FlowDiagnostic[]>([]);

  // Parse YAML and auto-layout nodes on mount or when YAML changes
  useEffect(() => {
    if (initialYaml) {
      const { nodes: parsedNodes, edges: parsedEdges } = nucleiYamlToGraph(initialYaml);
      if (parsedNodes.length > 0) {
        const layouted = calculateDagLayout(parsedNodes, parsedEdges);
        setNodes(layouted);
        setEdges(parsedEdges);
      } else {
        setNodes([]);
        setEdges([]);
      }
      setSelectedNodeId(null);
    }
  }, [initialYaml, setNodes, setEdges]);

  // Run graph validator on node/edge topology changes
  useEffect(() => {
    const diags = validateNucleiGraph(nodes, edges);
    setDiagnostics(diags);
  }, [nodes, edges]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Template name from root node
  const templateName = useMemo(() => {
    const root = nodes.find((n) => n.type === 'templateInfo');
    if (!root) return 'Untitled Template';
    return (root.data as { name?: string }).name || 'Untitled Template';
  }, [nodes]);

  // Hierarchical DAG Auto-Layout
  const autoLayout = useCallback(() => {
    const layouted = calculateDagLayout(nodes, edges);
    setNodes(layouted);
  }, [nodes, edges, setNodes]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    templateName,
    diagnostics,
    autoLayout,
  };
}
