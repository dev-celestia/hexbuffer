import { Button } from '@celestia-project/ui';
import { ChatCircleDotsIcon, TrashIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import type { ChatSession } from '../types';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  disabled?: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCreate: () => void;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  disabled = false,
  onSelect,
  onDelete,
  onCreate,
}: ChatSessionListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">Chats</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCreate}
          disabled={disabled}
          title={disabled ? 'Waiting for the assistant to finish…' : 'New chat'}
          aria-label="New chat"
        >
          <ChatCircleDotsIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Chat sessions">
        {sessions.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">
            No chats yet
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 p-1">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={disabled || undefined}
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(session.id);
                    }
                  }}
                  className={cn(
                    'group flex cursor-pointer items-center rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground',
                    disabled && 'cursor-not-allowed opacity-60',
                  )}
                  onClick={() => {
                    if (!disabled) onSelect(session.id);
                  }}
                >
                  <span className="flex-1 truncate">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className={cn(
                      'h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                      isActive && 'opacity-100',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) onDelete(session.id);
                    }}
                    title={disabled ? 'Waiting for the assistant to finish…' : 'Delete chat'}
                    aria-label={`Delete chat ${session.title}`}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
