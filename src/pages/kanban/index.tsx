import { useKanbanPage } from './hooks/use-kanban-page';
import { KanbanToolbar } from './components/kanban-toolbar';
import { KanbanColumnPanel } from './components/kanban-column-panel';
import { KanbanAddModal } from './components/kanban-add-modal';
import { KanbanDetailModal } from './components/kanban-detail-modal';
import { KanbanCardItem } from './components/kanban-card-item';
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, DragOverlay, closestCorners, MeasuringStrategy } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

export function KanbanPage() {
  const page = useKanbanPage();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // ponytail: 8px drag threshold lets mouse clicks through reliably
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // ponytail: 200ms touch delay lets mobile users swipe-scroll the board without accidental drags
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    page.handleDragStart(event.active.id as string);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    page.handleDragEnd(active.id as string, over ? (over.id as string) : null);
  };

  const activeCard = page.draggingId ? page.cards.find((c) => c.id === page.draggingId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <KanbanToolbar
          groupBy={page.groupBy}
          onGroupByChange={page.setGroupBy}
          totalCards={page.totalCards}
          doneCards={page.doneCards}
          onAddCardClick={() => page.openAddModal()}
        />

        {/* Board scroll area */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-start",

              // Sizing & Spacing
              "h-full p-4 gap-4"
            )}
            style={{ minWidth: 'max-content' }}
          >
            {page.columns.map((col) => (
              <KanbanColumnPanel
                key={col.id}
                column={col}
                cards={page.getColumnCards(col.id)}
                draggingId={page.draggingId}
                onToggleSubtask={page.toggleSubtask}
                onAddCardClick={page.openAddModal}
                onCardClick={page.openDetailModal}
              />
            ))}
          </div>
        </div>

        <KanbanAddModal
          isOpen={page.isAddModalOpen}
          onClose={page.closeAddModal}
          defaultColumnId={page.activeAddColumnId}
          onAdd={page.addCard}
        />

        {/* ponytail: detail modal triggers when card click state is set */}
        <KanbanDetailModal
          isOpen={!!page.selectedCardId}
          onClose={page.closeDetailModal}
          card={page.cards.find((c) => c.id === page.selectedCardId)}
          onSave={page.updateCard}
          onDelete={page.deleteCard}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div
            className={cn(
              // Layout & Positioning
              "pointer-events-none rotate-[2deg]",

              // Sizing & Spacing
              "w-[262px]",

              // Visuals & Colors
              "shadow-lg"
            )}
          >
            <KanbanCardItem
              card={activeCard}
              isDragging={false}
              isOverlay
              onToggleSubtask={() => {}}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
