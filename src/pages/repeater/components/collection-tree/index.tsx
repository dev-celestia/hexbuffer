import React from 'react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@celestia-project/ui';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FolderDashedIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { useCollectionsStore } from '@/stores/collections';
import { cn } from '@/lib/utils';
import { TreeNodeRow } from './tree-node-row';
import { InlineCreate } from './inline-create';
import { useCollectionsTree } from './use-collections-tree';
import { CollectionDropZone } from './collection-drop-zone';
import { TreeHeader } from './tree-header';
import { TreeFilter } from './tree-filter';
import { DragOverlayContent } from './drag-overlay-content';
import { DeleteDialog } from './delete-dialog';
import { ImportDialog } from './import-dialog';

export function CollectionsTree({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const selectedNodeId = useCollectionsStore((s) => s.selectedNodeId);
  const {
    expandedIds,
    filterQuery,
    isFiltering,
    inlineCreate,
    renameTarget,
    renameValue,
    setRenameValue,
    dragActiveId,
    dragOverId,
    deleteTarget,
    importDialogOpen,
    sensors,
    flatNodes,
    activeNode,
    flatNodeIds,
    nonEmptyStashIds,
    stashEndpointCounts,
    deleteImpact,
    importSummary,
    handleToggleExpand,
    handleSelectNode,
    handleAddChild,
    handleCreateSubmit,
    handleCreateCancel,
    handleRename,
    handleRenameSubmit,
    handleRenameBlur,
    handleRenameCancel,
    handleDelete,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleExport,
    handleImportClick,
    handleImportConfirm,
    handleImportCancel,
    handleCreateCollection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    setDeleteTarget,
    setImportDialogOpen,
    setFilterQuery,
  } = useCollectionsTree(workspaceId);

  // Only endpoints count as results — the collections above them are the path to a result, not
  // results in their own right, so counting them would inflate the number the user is reading.
  const matchCount = flatNodes.filter((node) => node.kind === 'endpoint').length;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col'
      )}
    >
      <TreeHeader
        onExport={handleExport}
        onImportClick={handleImportClick}
        onCreateCollection={handleCreateCollection}
      />

      <TreeFilter value={filterQuery} onChange={setFilterQuery} matchCount={matchCount} />

      {/* Tree */}
      <div
        className={cn(
          // Layout & Positioning
          'min-h-0 flex-1 overflow-auto',

          // Sizing & Spacing
          'px-1.5 py-1.5'
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.WhileDragging,
            },
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={isFiltering ? [] : flatNodeIds}
            strategy={verticalListSortingStrategy}
          >
            {flatNodes.length === 0 ? (
              isFiltering ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MagnifyingGlassIcon />
                    </EmptyMedia>
                    <EmptyTitle>No matches</EmptyTitle>
                    <EmptyDescription>
                      No collection or endpoint matches “{filterQuery.trim()}”.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button leading="tight"
                      variant="outline"
                      size="sm"
                      className={cn(
                        // Sizing & Spacing
                        'px-2'
                      )}
                      onClick={() => setFilterQuery('')}
                    >
                      Clear filter
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderDashedIcon />
                    </EmptyMedia>
                    <EmptyTitle>No collections</EmptyTitle>
                    <EmptyDescription>
                      Collections group related endpoints. Create one to start organising requests.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button leading="tight"
                      variant="outline"
                      size="sm"
                      className={cn(
                        // Sizing & Spacing
                        'px-2'
                      )}
                      onClick={handleCreateCollection}
                    >
                      <PlusIcon className="size-3.5" />
                      New collection
                    </Button>
                  </EmptyContent>
                </Empty>
              )
            ) : (
              flatNodes.map((node) => {
                const isInlineCreateParent = inlineCreate && inlineCreate.parentId === node.originalId;

                return (
                  <React.Fragment key={node.id}>
                    <TreeNodeRow
                      node={node}
                      isSelected={selectedNodeId === node.id}
                      isExpanded={expandedIds.has(node.id)}
                      isDragOver={false}
                      dropAction={null}
                      endpointCount={stashEndpointCounts.get(node.originalId) ?? 0}
                      isFiltering={isFiltering}
                      highlightQuery={filterQuery}
                      isRenaming={renameTarget?.id === node.id}
                      renameValue={renameValue}
                      onRenameValueChange={setRenameValue}
                      onRenameSubmit={handleRenameSubmit}
                      onRenameCancel={handleRenameCancel}
                      onSelect={handleSelectNode}
                      onToggleExpand={handleToggleExpand}
                      onAddChild={handleAddChild}
                      onRename={handleRename}
                      onDelete={handleDelete}
                    />
                    {/* Drop zone for empty expanded collections. Suppressed while filtering: the
                        rows on screen are a projection, so an insertion target drawn inside one
                        would not correspond to a real position in the list. */}
                    {node.kind === 'collection' &&
                      !isFiltering &&
                      expandedIds.has(node.id) &&
                      !nonEmptyStashIds.has(node.originalId) && (
                        <CollectionDropZone
                          stashId={node.originalId}
                          depth={node.depth + 1}
                          isActive={
                            dragActiveId !== null &&
                            dragOverId === `dropzone-${node.originalId}`
                          }
                          isDragging={dragActiveId !== null}
                          onAddChild={(parentId) => handleAddChild(parentId, 'endpoint')}
                        />
                      )}
                    {/* Inline create input */}
                    {isInlineCreateParent && !isFiltering && (
                      <InlineCreate
                        depth={node.depth + 1}
                        type={inlineCreate.type}
                        onSubmit={handleCreateSubmit}
                        onCancel={handleCreateCancel}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            <DragOverlayContent node={activeNode} />
          </DragOverlay>
        </DndContext>
      </div>

      <DeleteDialog
        deleteTarget={deleteTarget}
        deleteImpact={deleteImpact}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ImportDialog
        open={importDialogOpen}
        summary={importSummary}
        onOpenChange={setImportDialogOpen}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />
    </div>
  );
}
