import { Button } from '@celestia-project/ui';
import { ChatCircleDotsIcon, PencilSimpleIcon, TrashIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { ChatSession } from '../types';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  disabled?: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCreate: () => void;
  onRename?: (sessionId: string, title: string) => void;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  disabled = false,
  onSelect,
  onDelete,
  onCreate,
  onRename,
}: Readonly<ChatSessionListProps>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (session: ChatSession) => {
    if (disabled || !onRename) return;
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleCommitRename = (sessionId: string) => {
    if (editTitle.trim() && onRename) {
      onRename(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full flex-col',
        // Backgrounds & Borders
        'border-inline-end border-border/60 bg-muted/20',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between',
          // Sizing & Spacing
          'px-3 py-2',
          // Backgrounds & Borders
          'border-b border-border/60',
        )}
      >
        <span
          className={cn(
            // Typography
            'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
          )}
        >
          Chats
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreate}
          disabled={disabled}
          title={disabled ? 'Waiting for the assistant to finish…' : 'New chat'}
          aria-label="New chat"
          className={cn(
            // Sizing & Spacing
            'size-6',
          )}
        >
          <ChatCircleDotsIcon className="size-3.5" />
        </Button>
      </div>

      {/* Session list */}
      <div
        className={cn(
          // Layout & Positioning
          'flex-1 overflow-y-auto',
          // Sizing & Spacing
          'p-1.5',
        )}
      >
        {sessions.length === 0 ? (
          <div
            className={cn(
              // Sizing & Spacing
              'p-4',
              // Typography
              'text-center text-xs text-muted-foreground',
            )}
          >
            No chats yet
          </div>
        ) : (
          <div
            role="list"
            aria-label="Chat sessions"
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1',
            )}
          >
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;

              if (isEditing) {
                return (
                  <div
                    key={session.id}
                    className={cn(
                      // Layout & Positioning
                      'flex items-center gap-1',
                      // Sizing & Spacing
                      'px-2 py-1',
                      // Backgrounds & Borders
                      'rounded-md bg-accent/60 border border-primary/40',
                    )}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      aria-label={`Rename chat ${session.title}`}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommitRename(session.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleCancelRename();
                        }
                      }}
                      className={cn(
                        // Sizing & Spacing
                        'w-full min-w-0 px-1 py-0.5',
                        // Typography
                        'text-xs bg-background text-foreground',
                        // Backgrounds & Borders
                        'rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary',
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0 text-success hover:text-success/80"
                      onClick={() => handleCommitRename(session.id)}
                      title="Save name"
                    >
                      <CheckIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={handleCancelRename}
                      title="Cancel"
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={session.id}
                  role="listitem"
                  className={cn(
                    // Layout & Positioning
                    'group relative flex items-center justify-between',
                    // Sizing & Spacing
                    'px-2.5 py-1.5',
                    // Typography
                    'text-xs',
                    // Backgrounds & Borders
                    'rounded-md transition-colors duration-150',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground shadow-2xs'
                      : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
                    disabled && 'opacity-60',
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    title={session.title}
                    aria-current={isActive ? 'true' : undefined}
                    onDoubleClick={() => handleStartRename(session)}
                    onClick={() => {
                      if (!disabled) onSelect(session.id);
                    }}
                    className={cn(
                      // Layout & Positioning
                      'flex-1 truncate pe-2 text-start cursor-pointer bg-transparent border-0 p-0',
                      // Interactive & States
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm',
                      disabled && 'cursor-not-allowed',
                    )}
                  >
                    {session.title}
                  </button>
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex items-center gap-1 shrink-0',
                      // Interactive & States
                      'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
                      (isActive || pendingDeleteId === session.id) && 'opacity-100',
                    )}
                  >
                    {pendingDeleteId === session.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          className={cn(
                            // Sizing & Spacing
                            'size-5 shrink-0 p-0',
                            // Typography
                            'text-destructive hover:text-destructive',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(null);
                            if (!disabled) onDelete(session.id);
                          }}
                          title="Confirm delete"
                          aria-label={`Confirm delete chat ${session.title}`}
                        >
                          <CheckIcon className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            // Sizing & Spacing
                            'size-5 shrink-0 p-0',
                            // Typography
                            'text-muted-foreground hover:text-foreground',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(null);
                          }}
                          title="Cancel delete"
                          aria-label="Cancel delete"
                        >
                          <XIcon className="size-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {onRename && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className={cn(
                              // Sizing & Spacing
                              'size-5 shrink-0 p-0',
                              // Typography
                              'text-muted-foreground hover:text-foreground',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(session);
                            }}
                            title="Rename chat"
                            aria-label={`Rename chat ${session.title}`}
                          >
                            <PencilSimpleIcon className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          className={cn(
                            // Sizing & Spacing
                            'size-5 shrink-0 p-0',
                            // Typography
                            'text-muted-foreground hover:text-destructive',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) setPendingDeleteId(session.id);
                          }}
                          title={disabled ? 'Waiting for the assistant to finish…' : 'Delete chat'}
                          aria-label={`Delete chat ${session.title}`}
                        >
                          <TrashIcon className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
