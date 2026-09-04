# Reusable Flow Components Guide (`@xyflow/react`)

Hexbuffer provides a set of pre-built, theme-consistent primitives for `@xyflow/react` in `@/components/flow`.

## Directory Overview

- `src/components/flow/canvas/`: `<FlowCanvas>`, `<FlowControls>`, `<FlowMiniMap>`, `<FlowBackground>`, `<FlowCommandHelp>`, `<FlowEmptyState>`
- `src/components/flow/nodes/`: `<FlowNodeShell>`, `<FlowNodeHeader>`, `<FlowNodeBody>`, `<FlowNodeFooter>`, `<FlowNodeHandle>`, `<FlowNodeStatus>`
- `src/components/flow/edges/`: `<FlowDeletableEdge>`, `<FlowLabeledEdge>`
- `src/components/flow/overlays/`: `<FlowToolbar>`, `<FlowNodeToolbar>`
- `src/components/flow/hooks/`: `useFlowKeyboard`

## Quick Example

```tsx
import { FlowCanvas, FlowEmptyState, FlowNodeShell, FlowNodeHeader, FlowNodeHandle } from '@/components/flow';
import { Position } from '@xyflow/react';

// Canvas Example
export function CanvasWrapper(props) {
  return (
    <FlowCanvas
      nodes={props.nodes}
      edges={props.edges}
      onNodesChange={props.onNodesChange}
      onEdgesChange={props.onEdgesChange}
      onConnect={props.onConnect}
      nodeTypes={props.nodeTypes}
      edgeTypes={props.edgeTypes}
      showMiniMap
      showControls
      showBackground
      showHelpBadge
      enableSpacePan
    />
  );
}

// Node Example
export function CustomNode({ id, data, selected }) {
  return (
    <FlowNodeShell variant="action" selected={selected} status={data.status}>
      <FlowNodeHandle type="target" position={Position.Top} variant="action" />
      <FlowNodeHeader title={data.label} subtitle="Action" />
      <FlowNodeHandle type="source" position={Position.Bottom} variant="action" />
    </FlowNodeShell>
  );
}
```
