import { Button } from '@celestia-project/ui';
import {
  ChatTeardropTextIcon,
  CheckIcon,
  PencilSimpleLineIcon,
  PlusIcon,
  TrashSimpleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { ChatSession } from '../types';
import { formatChatDateSeparator, formatMessageTime } from '../lib/date-utils';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  disabled?: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCreate: () => void;
  onRename?: (sessionId: string, title: string) => void;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((todayStart - targetStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return formatMessageTime(date);
  }
  return formatChatDateSeparator(date);
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
          'px-3 py-2.5',
          // Backgrounds & Borders
          'border-b border-border/60',
        )}
      >
        <span
          className={cn(
            // Typography
            'text-[11px] font-semibold text-muted-foreground uppercase tracking-widest',
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
            'size-7',
            // Backgrounds & Borders
            'rounded-md',
            // Interactive & States
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors duration-150',
          )}
        >
          <PlusIcon className="size-4" weight="bold" />
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
              // Layout & Positioning
              'flex flex-col items-center justify-center',
              // Sizing & Spacing
              'px-4 py-10 gap-3',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center justify-center',
                // Sizing & Spacing
                'size-10',
                // Backgrounds & Borders
                'rounded-full bg-muted',
              )}
            >
              <ChatTeardropTextIcon
                className="size-5 text-muted-foreground/60"
                weight="regular"
              />
            </div>
            <div
              className={cn(
                // Typography
                'text-center text-xs text-muted-foreground/80',
              )}
            >
              <p className="font-medium text-foreground/70">No chats yet</p>
              <p className="mt-0.5">Start a new conversation</p>
            </div>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Chat sessions"
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-0.5',
            )}
          >
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;
              const isPendingDelete = pendingDeleteId === session.id;

              if (isEditing) {
                return (
                  <div
                    key={session.id}
                    className={cn(
                      // Layout & Positioning
                      'flex items-center gap-1.5',
                      // Sizing & Spacing
                      'px-2 py-1.5',
                      // Backgrounds & Borders
                      'rounded-md bg-accent/50 border border-primary/30',
                    )}
                  >
                    <ChatTeardropTextIcon
                      className="size-3.5 shrink-0 text-primary/70"
                      weight="regular"
                    />
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
                        'w-full min-w-0 px-1.5 py-0.5',
                        // Typography
                        'text-xs bg-background text-foreground',
                        // Backgrounds & Borders
                        'rounded border border-input',
                        // Interactive & States
                        'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        // Sizing & Spacing
                        'size-6 shrink-0',
                        // Typography
                        'text-success',
                        // Backgrounds & Borders
                        'rounded-md',
                        // Interactive & States
                        'hover:bg-success/10 hover:text-success',
                        'transition-colors duration-150',
                      )}
                      onClick={() => handleCommitRename(session.id)}
                      title="Save name"
                    >
                      <CheckIcon className="size-3.5" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        // Sizing & Spacing
                        'size-6 shrink-0',
                        // Typography
                        'text-muted-foreground',
                        // Backgrounds & Borders
                        'rounded-md',
                        // Interactive & States
                        'hover:bg-muted hover:text-foreground',
                        'transition-colors duration-150',
                      )}
                      onClick={handleCancelRename}
                      title="Cancel"
                    >
                      <XIcon className="size-3.5" weight="bold" />
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
                    'px-2 py-1.5',
                    // Backgrounds & Borders
                    'rounded-md',
                    // Interactive & States
                    'transition-all duration-150 ease-out',
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-2xs'
                      : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
                    isPendingDelete && 'bg-destructive/5 border border-destructive/20',
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
                      'flex flex-1 items-center gap-2 min-w-0 text-start cursor-pointer bg-transparent border-0 p-0',
                      // Interactive & States
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm',
                      disabled && 'cursor-not-allowed',
                    )}
                  >
                    <ChatTeardropTextIcon
                      className={cn(
                        // Sizing & Spacing
                        'size-3.5 shrink-0',
                        // Interactive & States
                        'transition-colors duration-150',
                        isActive
                          ? 'text-accent-foreground/70'
                          : 'text-muted-foreground/50 group-hover:text-muted-foreground',
                      )}
                      weight="regular"
                    />
                    <span className="flex-1 min-w-0 truncate text-xs">
                      {session.title}
                    </span>
                  </button>

                  {/* Date / Actions */}
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex items-center gap-1 shrink-0',
                      // Interactive & States
                      'transition-opacity duration-150',
                      isActive || isPendingDelete
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                    )}
                  >
                    {isPendingDelete ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          className={cn(
                            // Sizing & Spacing
                            'size-6 shrink-0',
                            // Typography
                            'text-destructive',
                            // Backgrounds & Borders
                            'rounded-md',
                            // Interactive & States
                            'hover:bg-destructive/10 hover:text-destructive',
                            'transition-colors duration-150',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(null);
                            if (!disabled) onDelete(session.id);
                          }}
                          title="Confirm delete"
                          aria-label={`Confirm delete chat ${session.title}`}
                        >
                          <CheckIcon className="size-3.5" weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            // Sizing & Spacing
                            'size-6 shrink-0',
                            // Typography
                            'text-muted-foreground',
                            // Backgrounds & Borders
                            'rounded-md',
                            // Interactive & States
                            'hover:bg-muted hover:text-foreground',
                            'transition-colors duration-150',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(null);
                          }}
                          title="Cancel delete"
                          aria-label="Cancel delete"
                        >
                          <XIcon className="size-3.5" weight="bold" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Timestamp shown on hover, hidden when actions appear */}
                        <span
                          className={cn(
                            // Typography
                            'text-[10px] text-muted-foreground/60 tabular-nums',
                            // Interactive & States
                            'group-hover:hidden',
                            isActive && 'hidden',
                          )}
                        >
                          {formatSessionDate(session.updatedAt)}
                        </span>

                        <div
                          className={cn(
                            // Layout & Positioning
                            'flex items-center gap-0.5',
                            // Interactive & States
                            'hidden group-hover:flex',
                            isActive && 'flex',
                          )}
                        >
                          {onRename && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={disabled}
                              className={cn(
                                // Sizing & Spacing
                                'size-6 shrink-0',
                                // Typography
                                'text-muted-foreground',
                                // Backgrounds & Borders
                                'rounded-md',
                                // Interactive & States
                                'hover:bg-accent hover:text-foreground',
                                'transition-colors duration-150',
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(session);
                              }}
                              title="Rename chat"
                              aria-label={`Rename chat ${session.title}`}
                            >
                              <PencilSimpleLineIcon className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className={cn(
                              // Sizing & Spacing
                              'size-6 shrink-0',
                              // Typography
                              'text-muted-foreground',
                              // Backgrounds & Borders
                              'rounded-md',
                              // Interactive & States
                              'hover:bg-destructive/10 hover:text-destructive',
                              'transition-colors duration-150',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) setPendingDeleteId(session.id);
                            }}
                            title={disabled ? 'Waiting for the assistant to finish…' : 'Delete chat'}
                            aria-label={`Delete chat ${session.title}`}
                          >
                            <TrashSimpleIcon className="size-3.5" />
                          </Button>
                        </div>
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
