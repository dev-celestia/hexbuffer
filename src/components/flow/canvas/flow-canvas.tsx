import React from 'react';
import {
  ReactFlow,
  type ReactFlowProps,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import { useFlowKeyboard } from '../hooks/use-flow-keyboard';
import { FlowBackground } from './flow-background';
import { FlowControls } from './flow-controls';
import { FlowMiniMap } from './flow-minimap';
import { FlowCommandHelp } from './flow-command-help';
import type { FlowCommandHelpItem } from '../types';

export interface FlowCanvasProps<NodeType extends Node = Node, EdgeType extends Edge = Edge>
  extends Omit<ReactFlowProps<NodeType, EdgeType>, 'className'> {
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  showHelpBadge?: boolean;
  enableSpacePan?: boolean;
  emptyState?: React.ReactNode;
  helpItems?: FlowCommandHelpItem[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  wrapperClassName?: string;
}

export function FlowCanvas<NodeType extends Node = Node, EdgeType extends Edge = Edge>({
  nodes = [],
  edges = [],
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  showHelpBadge = true,
  enableSpacePan = true,
  emptyState,
  helpItems,
  containerRef,
  className,
  wrapperClassName,
  children,
  fitView = true,
  snapToGrid = true,
  snapGrid = [16, 16],
  panOnScroll = true,
  deleteKeyCode = ['Backspace', 'Delete'],
  ...reactFlowProps
}: FlowCanvasProps<NodeType, EdgeType>) {
  const localWrapperRef = React.useRef<HTMLDivElement>(null);
  const targetRef = containerRef ?? localWrapperRef;
  const { spacePressed } = useFlowKeyboard({ enableSpacePan });

  if (emptyState && nodes.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      ref={targetRef}
      className={cn(
        // Layout & Positioning
        'relative h-full w-full select-none',
        // Interactive & States
        spacePressed && 'cursor-grab active:cursor-grabbing',
        wrapperClassName,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        panOnDrag={spacePressed}
        selectionOnDrag={!spacePressed}
        panOnScroll={panOnScroll}
        fitView={fitView}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
        deleteKeyCode={deleteKeyCode}
        className={cn(
          // Layout & Positioning
          'h-full w-full',
          className,
        )}
        {...reactFlowProps}
      >
        {showControls && <FlowControls />}
        {showBackground && <FlowBackground />}
        {showMiniMap && <FlowMiniMap />}
        {children}
      </ReactFlow>

      {showHelpBadge && <FlowCommandHelp items={helpItems} />}
    </div>
  );
}
