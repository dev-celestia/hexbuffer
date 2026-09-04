import React from 'react';
import type { EdgeProps } from '@xyflow/react';
import { FlowDeletableEdge } from '@/components/flow';

export function DeletableEdge(props: EdgeProps) {
  const handleDelete = React.useCallback(
    (edgeId: string) => {
      window.dispatchEvent(
        new CustomEvent('automation-delete-edge', { detail: { edgeId } })
      );
    },
    []
  );

  return <FlowDeletableEdge {...props} onDeleteEdge={handleDelete} />;
}

