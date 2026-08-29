import { Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { XIcon, DotsSixIcon } from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';

import { getAppIconImage, type NavItem } from '../../constants';

export interface DockItemProps {
  item: NavItem;
  active: boolean;
  isOpened: boolean;
  onClose?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export function DockItem({
  item,
  active,
  isOpened,
  onClose,
  onClick,
  children,
}: DockItemProps) {
  const seenNewApps = useAppSettingsStore((s) => s.seenNewApps);
  const isNew = Boolean(item.isNew && !seenNewApps?.includes(item.href));
  const imageSrc = getAppIconImage(item.href, item.label);

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="relative size-7 group/dock-item touch-none shrink-0" />}>
        <Link
            to={item.href}
            onClick={onClick}
            className={cn(
              // Layout & Positioning
              "flex size-full items-center justify-center overflow-hidden",

              // Sizing & Spacing
              "rounded-sm",

              // Backgrounds & Borders
              "border shadow-xs select-none",
              item.colors ? `${item.colors.bg} ${item.colors.border}` : "bg-muted/40 border-transparent text-muted-foreground",

              // Interactive & States
              "transition-all active:scale-90 duration-150 text-white",
              active
                ? "opacity-100 ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                : "opacity-85 hover:opacity-100 hover:scale-105"
            )}
          >
            {children}
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={item.label}
                draggable={false}
                className={cn(
                  // Layout & Positioning
                  "object-cover",

                  // Sizing & Spacing
                  "size-full",

                  // Interactive & States
                  "transition-transform duration-150 group-hover/dock-item:scale-110 select-none"
                )}
              />
            ) : (
              <item.icon className="size-5 transition-transform duration-150 group-hover/dock-item:scale-110" />
            )}

            {/* OS-style open indicator dot */}
            {isOpened && (
              <span
                className={cn(
                  // Layout & Positioning
                  "absolute bottom-[-10px] left-1/2 -translate-x-1/2",

                  // Sizing & Spacing
                  "size-1 rounded-full",

                  // Backgrounds & Borders
                  "bg-primary",

                  // Interactive & States
                  "transition-all duration-200",
                  active ? "bg-primary w-3 h-1 shadow-[0_0_4px_rgba(59,130,246,0.6)]" : "bg-muted-foreground/60 scale-75"
                )}
              />
            )}
          </Link>

          {/* Close button that appears on hover */}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 scale-90 pointer-events-none group-hover/dock-item:opacity-100 group-hover/dock-item:scale-100 group-hover/dock-item:pointer-events-auto transition-all duration-150 cubic-bezier(0.23, 1, 0.32, 1) shadow-sm border border-background hover:scale-110 active:scale-95 cursor-pointer z-10"
              aria-label={`Close ${item.label}`}
            >
              <XIcon className="size-2.5" />
            </button>
          )}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={12} className="flex items-center gap-1.5 font-sans">
        <span>{item.label}</span>
        {isNew && (
          <span className={cn(
            "text-[9px] font-extrabold uppercase tracking-wider px-1 rounded-sm leading-none py-0.5",
            "bg-purple-500/20 text-purple-600 dark:text-purple-400"
          )}>
            NEW
          </span>
        )}
        {item.flag && item.flag !== 'release' && (
          <span className={cn(
            "text-[9px] font-extrabold uppercase tracking-wider px-1 rounded-sm leading-none py-0.5",
            item.flag === 'alpha'
              ? "bg-rose-500/20 text-rose-500 dark:text-rose-400"
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {item.flag}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function SortableDockItem({
  item,
  active,
  dragActive,
  isOpened,
  onClose,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  dragActive: React.RefObject<boolean>;
  isOpened: boolean;
  onClose?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.href });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="shrink-0" {...attributes} {...listeners}>
      <DockItem
        item={item}
        active={active}
        isOpened={isOpened}
        onClose={onClose}
        onClick={(e) => {
          if (dragActive.current) {
            e.preventDefault();
            return;
          }
          if (onClick) onClick(e);
        }}
      >
        {/* Drag grip indicator — visible on hover */}
        <DotsSixIcon className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-2.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover/dock-item:opacity-100" />
      </DockItem>
    </div>
  );
}
