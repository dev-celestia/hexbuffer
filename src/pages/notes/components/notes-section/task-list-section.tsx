import * as React from 'react';
import { SquareIcon, CheckSquareIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { renderInlineFormatting } from '../notes-preview/inline-formatter';
import type { TaskListSectionProps } from './types';

export const TaskListSection = React.memo(function TaskListSection({
  block,
  onToggleTask,
}: TaskListSectionProps) {
  const tasks = block.data?.tasks || [];

  return (
    <ul
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-1.5 my-1 ps-1"
      )}
    >
      {tasks.map((task) => (
        <li
          key={task.lineIndex}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTask(task.lineIndex);
          }}
          className={cn(
            // Layout & Positioning
            "group/task flex items-center select-none",

            // Sizing & Spacing
            "gap-2",

            // Typography
            "text-xs sm:text-sm",

            // Interactive & States
            "cursor-pointer"
          )}
        >
          {task.isChecked ? (
            <CheckSquareIcon
              className={cn(
                // Sizing & Spacing
                "size-4 shrink-0",

                // Typography
                "text-primary",

                // Interactive & States
                "transition-transform group-hover/task:scale-110"
              )}
            />
          ) : (
            <SquareIcon
              className={cn(
                // Sizing & Spacing
                "size-4 shrink-0",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "transition-transform group-hover/task:scale-110"
              )}
            />
          )}
          <span
            className={cn(
              // Typography
              task.isChecked ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {renderInlineFormatting(task.text)}
          </span>
        </li>
      ))}
    </ul>
  );
});
