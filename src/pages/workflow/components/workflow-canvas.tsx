import React from 'react';
import { BackgroundVariant } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import {
  FlowCanvas,
  FlowEmptyState,
} from '@/components/flow';

import type { AutomationNodeType, AutomationNodeData } from '../types';
import { useWorkflowCanvas, type WorkflowCanvasBridge } from '../hooks/use-workflow-canvas';
import { CanvasContextMenu } from './canvas-context-menu';
import { NodeContextMenu } from './node-context-menu';

interface WorkflowCanvasProps {
  addNodeRef?: React.MutableRefObject<((nodeType: AutomationNodeType) => void) | null>;
  persistRef?: React.MutableRefObject<(() => void) | null>;
  onSelectedNodeChange?: (node: Node<AutomationNodeData> | null) => void;
  bridgeRef?: React.MutableRefObject<WorkflowCanvasBridge | null>;
}

export function WorkflowCanvas({ addNodeRef, persistRef, onSelectedNodeChange, bridgeRef }: WorkflowCanvasProps) {
  const canvas = useWorkflowCanvas(addNodeRef, persistRef, onSelectedNodeChange, bridgeRef);

  if (!canvas.activeWorkflowId) {
    return (
      <FlowEmptyState
        title="Select or create a workflow to start building"
      />
    );
  }

  return (
    <FlowCanvas
      containerRef={canvas.reactFlowWrapper}
      className="automation-flow"
      nodes={canvas.nodes}
      edges={canvas.edges}
      onNodesChange={canvas.onNodesChange}
      onEdgesChange={canvas.onEdgesChange}
      onConnect={canvas.onConnect}
      isValidConnection={canvas.isValidConnection}
      onEdgeDoubleClick={canvas.onEdgeDoubleClick}
      onPaneContextMenu={canvas.onPaneContextMenu}
      onNodeContextMenu={canvas.onNodeContextMenu}
      onNodeClick={canvas.onNodeClick}
      onPaneClick={canvas.onPaneClick}
      nodeTypes={canvas.nodeTypes}
      edgeTypes={canvas.edgeTypes}
      defaultEdgeOptions={canvas.defaultEdgeOptions}
      connectionLineStyle={canvas.connectionLineStyle}
      onlyRenderVisibleElements
      fitView
      snapToGrid
      snapGrid={[16, 16]}
      deleteKeyCode={['Backspace', 'Delete']}
      showMiniMap
      showControls
      showBackground
      showHelpBadge
    >
      <CanvasContextMenu
        state={canvas.contextMenu}
        onClose={canvas.closeContextMenu}
        onAddNode={canvas.addNodeFromMenu}
        hasTriggerNode={canvas.hasTriggerNode}
        onRemoveTrigger={canvas.removeTriggerNode}
      />

      <NodeContextMenu
        state={canvas.nodeContextMenu}
        onClose={canvas.closeNodeContextMenu}
        onDelete={canvas.deleteNode}
        onProperties={(nodeId) => canvas.setSelectedNodeId(nodeId)}
      />
    </FlowCanvas>
  );
}
