import React, { useEffect } from 'react';
import {
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { FlowCanvas } from '@/components/flow';
import { cn } from '@/lib/utils';
import { NUCLEI_NODE_TYPES } from '../nodes';
import { NUCLEI_EDGE_TYPES } from '../edges/nuclei-flow-edge';
import { NucleiFlowToolbar } from './nuclei-flow-toolbar';
import { NucleiFlowInspector } from './nuclei-flow-inspector';
import { useNucleiFlow } from '../hooks/use-nuclei-flow';
import type { NucleiFlowNode, NucleiFlowEdge } from '../types';

interface NucleiFlowCanvasProps {
  yamlContent: string;
  hideToolbar?: boolean;
}

function NucleiFlowCanvasInner({
  yamlContent,
  hideToolbar = false,
}: NucleiFlowCanvasProps) {
  const { fitView } = useReactFlow();
  const flow = useNucleiFlow({ initialYaml: yamlContent });

  const handleAutoLayout = () => {
    flow.autoLayout();
    setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 50);
  };

  // Fit view whenever template YAML content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 300, padding: 0.25 });
    }, 100);
    return () => clearTimeout(timer);
  }, [yamlContent, fitView]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full min-h-0 overflow-hidden",
        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Top Toolbar (Optional if external toolbar is present) */}
      {!hideToolbar && (
        <NucleiFlowToolbar
          templateName={flow.templateName}
          diagnostics={flow.diagnostics}
          onAutoLayout={handleAutoLayout}
          onFitView={() => fitView({ duration: 300, padding: 0.25 })}
        />
      )}

      {/* Workspace Area: React Flow Canvas + Slide-Over Read-Only Inspector */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 relative flex overflow-hidden"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 h-full relative"
          )}
        >
          <FlowCanvas<NucleiFlowNode, NucleiFlowEdge>
            nodes={flow.nodes}
            edges={flow.edges}
            onNodesChange={flow.onNodesChange}
            onEdgesChange={flow.onEdgesChange}
            nodesConnectable={false}
            nodesDraggable={true}
            elementsSelectable={true}
            nodeTypes={NUCLEI_NODE_TYPES as any}
            edgeTypes={NUCLEI_EDGE_TYPES as any}
            onNodeClick={(_, node) => flow.setSelectedNodeId(node.id)}
            onPaneClick={() => flow.setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            snapToGrid
            snapGrid={[16, 16]}
            showMiniMap
            showControls
            showBackground
            className="nuclei-flow-canvas"
          />
        </div>

        {/* Slide-Over Property Inspector */}
        {flow.selectedNode && (
          <NucleiFlowInspector
            node={flow.selectedNode}
            onClose={() => flow.setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}

// ponytail: Flow canvas wrapper with ReactFlowProvider
export function NucleiFlowCanvas(props: NucleiFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <NucleiFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
