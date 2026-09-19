import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@celestia-project/ui';
import React, { useRef, useEffect } from 'react';
import { CaretDownIcon, DotsSixVerticalIcon, PlusIcon, TrashIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import folderIcon from '@/assets/explorer-icon/_folder.svg';
import folderOpenIcon from '@/assets/explorer-icon/_folder_open.svg';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { FlatNode, DropAction } from './utils';
import { ROW_HEIGHT, rowIndent } from './utils';
import { HighlightText } from './highlight-text';
import { getMethodTreatment } from '../../lib/method-styles';

// ── Props ──

export interface TreeNodeRowProps {
  node: FlatNode;
  isSelected: boolean;
  isExpanded: boolean;
  isDragOver: boolean;
  dropAction: DropAction | null;
  endpointCount: number;
  /**
   * True while the tree is showing filter results. Filtered rows are a read-only projection: the
   * hierarchy is forced open, so expanding and collapsing have nothing to act on, and reordering a
   * pruned list would renumber only the rows on screen. Both affordances are therefore withdrawn
   * rather than left as dead controls.
   */
  isFiltering?: boolean;
  /** Active filter text, used to mark the characters that caused this row to match. */
  highlightQuery?: string;
  isRenaming?: boolean;
  renameValue?: string;
  onRenameValueChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
  onSelect: (node: FlatNode) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string, type: 'endpoint' | 'collection') => void;
  onRename: (node: FlatNode) => void;
  onDelete: (node: FlatNode) => void;
}

// ── Component ──

export function TreeNodeRow({
  node,
  isSelected,
  isExpanded,
  isDragOver,
  dropAction,
  endpointCount,
  isFiltering = false,
  highlightQuery = '',
  isRenaming = false,
  renameValue = '',
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
  onSelect,
  onToggleExpand,
  onAddChild,
  onRename,
  onDelete,
}: Readonly<TreeNodeRowProps>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { flatNode: node },
    disabled: isFiltering,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const isCollection = node.kind === 'collection';
  const isEndpoint = node.kind === 'endpoint';
  const methodTreatment = getMethodTreatment(node.method);

  // A filtered row matched on its name, its method or its url, and the row only shows the name —
  // so the url rides a second line. Without it a url match renders as a highlight-free row, which
  // reads as a bug. It is shown for every filtered endpoint rather than only url matches so the
  // result list keeps one consistent row shape.
  const showUrlHint = isFiltering && isEndpoint && !!node.url;

  // Two-line rows are content-sized; everything else keeps the fixed rhythm the drop maths assumes.
  const isTwoLine = showUrlHint && !isRenaming;

  // Drop indicator classes
  const showBeforeLine = dropAction?.action === 'reorder-before';
  const showAfterLine = dropAction?.action === 'reorder-after';
  const showInsideHighlight = dropAction?.action === 'reparent';

  return (
    <div
      ref={setNodeRef}
      id={node.id}
      style={{
        ...style,
        paddingLeft: `${rowIndent(node.depth)}px`,
      }}
      className={cn(
        // Layout & Positioning
        'group/tree-row relative'
      )}
    >
      {/* Drop indicator: insert-before line */}
      {showBeforeLine && (
        <div className="bg-primary absolute -top-px right-2 left-2 z-10 h-0.5 rounded-full" />
      )}

      {/* Drop indicator: insert-after line */}
      {showAfterLine && (
        <div className="bg-primary absolute right-2 -bottom-px left-2 z-10 h-0.5 rounded-full" />
      )}

      <ContextMenu>
        <ContextMenuTrigger>
          <div
            style={{ height: isTwoLine ? undefined : ROW_HEIGHT }}
            className={cn(
              // Layout & Positioning
              'relative flex cursor-pointer items-center',

              // Sizing & Spacing
              'gap-1.5 rounded-md pr-1',
              isTwoLine && 'py-1',

              // Backgrounds & Borders
              isSelected && 'bg-accent',
              isDragOver && showInsideHighlight && 'bg-primary/20 ring-primary/40 ring-1',

              // Interactive & States
              'transition-colors',
              !isSelected && 'hover:bg-muted/60'
            )}
            onClick={() => {
              if (isRenaming) return;
              // Endpoints: select as usual
              if (isEndpoint) {
                onSelect(node);
              }
              // Collections: clicking row toggles expand (override for chevron handled separately)
            }}
          >
            {/* Selection rail — flush with the highlight's left edge so the two read as one mark */}
            {isSelected && (
              <span
                className={cn(
                  // Layout & Positioning
                  'absolute top-1.5 bottom-1.5 left-0',

                  // Sizing & Spacing
                  'w-0.5',

                  // Backgrounds & Borders
                  'bg-primary rounded-full'
                )}
              />
            )}

            {/* Expand/Collapse Chevron — becomes a spacer while filtering, since every match is
                already shown with its full path and there is nothing left to collapse. */}
            {isCollection && !isFiltering ? (
              <button
                type="button"
                className={cn(
                  // Layout & Positioning
                  'flex shrink-0 items-center justify-center',

                  // Sizing & Spacing
                  'size-4',

                  // Interactive & States
                  'text-muted-foreground hover:text-foreground'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(node.id);
                }}
                aria-label="Toggle expand"
              >
                <CaretDownIcon
                  className={cn('size-3.5 transition-transform', !isExpanded && '-rotate-90')}
                />
              </button>
            ) : (
              <span
                className={cn(
                  // Sizing & Spacing
                  'w-4 shrink-0'
                )}
              />
            )}

            {/* Folder icon — clickable for collections to toggle expand */}
            {/* ponytail: use custom SVG folder icons */}
            {isCollection && (
              <img
                src={isExpanded ? folderOpenIcon : folderIcon}
                alt="folder"
                className={cn(
                  // Sizing & Spacing
                  'size-4 shrink-0',

                  // Interactive & States
                  isFiltering ? 'transition-transform' : 'cursor-pointer transition-transform hover:scale-110'
                )}
                onClick={
                  isFiltering
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        onToggleExpand(node.id);
                      }
                }
              />
            )}

            {/* Label */}
            <div
              className={cn(
                // Layout & Positioning
                'min-w-0 flex-1',
                isCollection && !isFiltering && 'cursor-pointer'
              )}
              onClick={(e) => {
                if (isRenaming) {
                  e.stopPropagation();
                  return;
                }
                if (isCollection && !isFiltering) {
                  e.stopPropagation();
                  onToggleExpand(node.id);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!isRenaming) {
                  onRename(node);
                }
              }}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'flex min-w-0 items-center',

                  // Sizing & Spacing
                  'gap-2'
                )}
              >
                {/* Method badge for endpoints */}
                {isEndpoint && node.method && (
                  <span
                    className={cn(
                      // Layout & Positioning
                      'inline-flex shrink-0 items-center',

                      // Sizing & Spacing
                      'rounded border px-1',

                      // Typography
                      'font-mono text-[9px] leading-4 font-bold uppercase',

                      // Backgrounds & Borders
                      methodTreatment.pill
                    )}
                  >
                    {node.method}
                  </span>
                )}

                {isRenaming ? (
                  /* ponytail: Simple inline input handling blur/Enter/Escape to minimize state overhead */
                  <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => onRenameValueChange?.(e.target.value)}
                    onBlur={onRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onRenameSubmit?.();
                      } else if (e.key === 'Escape') {
                        e.stopPropagation();
                        onRenameCancel?.();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      // Sizing & Spacing
                      'h-5 w-full min-w-0 rounded px-1',

                      // Typography
                      'font-sans text-xs',

                      // Backgrounds & Borders
                      'border-ring/55 bg-background focus:border-ring focus:ring-ring border focus:ring-1 focus:outline-none'
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      // Layout & Positioning
                      'truncate',

                      // Typography
                      'text-xs',
                      isSelected && 'font-medium'
                    )}
                  >
                    {isFiltering ? (
                      <HighlightText text={node.label} query={highlightQuery} />
                    ) : (
                      node.label
                    )}
                  </span>
                )}

                {/* Endpoint count badge for collections */}
                {isCollection && endpointCount > 0 && !isRenaming && (
                  <span
                    className={cn(
                      // Layout & Positioning
                      'shrink-0',

                      // Typography
                      'text-[10px] leading-none tabular-nums',
                      isSelected ? 'text-foreground/60' : 'text-muted-foreground/60'
                    )}
                  >
                    {endpointCount}
                  </span>
                )}
              </div>

              {/* Second line: why this row is in the results. Rendered for every filtered endpoint
                  so the list keeps one shape; the highlight itself says which part matched. */}
              {isTwoLine && (
                <div
                  data-slot="tree-url-hint"
                  className={cn(
                    // Layout & Positioning
                    'truncate',

                    // Typography
                    'font-mono text-[10px] leading-4',
                    'text-muted-foreground'
                  )}
                >
                  <HighlightText text={node.url!} query={highlightQuery} />
                </div>
              )}
            </div>

            {/* Drag handle — drag trigger, visible on hover. Withdrawn while filtering, because
                reordering a pruned list would collide with the rows that were filtered out. */}
            {!isFiltering && (
              <button
                type="button"
                className={cn(
                  // Layout & Positioning
                  'flex shrink-0 touch-none items-center justify-center',

                  // Sizing & Spacing
                  'h-5 w-4 rounded-sm',

                  // Interactive & States
                  'text-muted-foreground/30 group-hover/tree-row:opacity-100 hover:text-muted-foreground cursor-grab opacity-0 transition-opacity active:cursor-grabbing'
                )}
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <DotsSixVerticalIcon className="size-3.5" />
              </button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {isCollection && (
            <>
              <ContextMenuItem
                onClick={() => onAddChild(node.originalId, 'endpoint')}
                className="text-xs"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                New Endpoint
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onAddChild(node.originalId, 'collection')}
                className="text-xs"
              >
                <img src={folderIcon} className="mr-2 h-4 w-4" alt="folder" />
                New Folder
              </ContextMenuItem>
            </>
          )}
          <ContextMenuItem onClick={() => onRename(node)} className="text-xs">
            <PencilSimpleIcon className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDelete(node)} variant="destructive" className="text-xs">
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
