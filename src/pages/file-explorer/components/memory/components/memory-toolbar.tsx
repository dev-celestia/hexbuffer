import * as React from 'react';
import {
  ArrowClockwiseIcon,
  CircleNotchIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Badge, Button, Input } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { MemoryState } from '../hooks/use-memory';

interface MemoryToolbarProps {
  state: MemoryState;
}

export function MemoryToolbar({ state }: Readonly<MemoryToolbarProps>) {
  const {
    searchQuery,
    setSearchQuery,
    loading,
    handleRefresh,
    handleOpenCreate,
    handleReindex,
    reindexing,
    embeddingsActive,
    embeddingsBlocked,
    embeddingsModel,
    embeddedCount,
    entries,
  } = state;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0 select-none",

        // Sizing & Spacing
        "px-3 py-1.5 gap-3",

        // Backgrounds & Borders
        "border-b border-border bg-muted/40"
      )}
    >
      {/* Search Bar */}
      <div
        className={cn(
          // Layout & Positioning
          "relative flex items-center flex-1 max-w-sm"
        )}
      >
        <MagnifyingGlassIcon
          className={cn(
            // Layout & Positioning
            "absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

            // Sizing & Spacing
            "size-3.5",

            // Typography
            "text-muted-foreground"
          )}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memory (title, content, tags)…"
          className={cn(
            // Sizing & Spacing
            "h-7 w-full ps-8 pe-7",

            // Typography
            "text-xs"
          )}
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={cn(
              // Layout & Positioning
              "absolute end-2 top-1/2 -translate-y-1/2",

              // Sizing & Spacing
              "rounded p-0.5",

              // Typography
              "text-muted-foreground",

              // Interactive & States
              "hover:text-foreground hover:bg-muted"
            )}
            title="Clear search"
          >
            <XIcon
              className={cn(
                // Sizing & Spacing
                "size-3"
              )}
            />
          </button>
        )}
      </div>

      {/* Actions & Status */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2"
        )}
      >
        <Badge
          variant={embeddingsActive ? 'default' : 'secondary'}
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1",

            // Sizing & Spacing
            "h-6 px-2",

            // Typography
            "text-[11px] font-mono"
          )}
          title={
            embeddingsActive
              ? `Vector search enabled with ${embeddingsModel}. ${embeddedCount}/${entries.length} entries have vectors.`
              : embeddingsBlocked
                ? `Embeddings are configured (${embeddingsModel}) but the endpoint is remote and third-party AI data sharing is off, so new entries are stored without vectors. Enable third-party AI data sharing in Settings, or point the embeddings endpoint at a local server.`
                : 'Vector search is disabled. Memory falls back to SQLite FTS5 keyword matching.'
          }
        >
          <LightningIcon
            className={cn(
              // Sizing & Spacing
              "size-3"
            )}
          />
          {embeddingsActive
            ? `RAG: ${embeddingsModel ?? 'active'} (${embeddedCount}/${entries.length})`
            : embeddingsBlocked
              ? 'RAG: Needs sharing consent'
              : 'RAG: Keyword FTS5'}
        </Badge>

        {/*
          Only offered when a reindex can actually succeed. With sharing off on a remote endpoint
          the backend rejects the call outright, so a visible button would exist purely to raise an
          error toast; the badge above carries the remedy instead.
        */}
        {embeddingsActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReindex}
            disabled={reindexing || loading}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",

              // Sizing & Spacing
              "h-7 px-2.5",

              // Typography
              "text-xs"
            )}
            title="Re-compute vectors for entries missing embeddings or created under another model"
          >
            {reindexing ? (
              <CircleNotchIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5",

                  // Interactive & States
                  "animate-spin"
                )}
              />
            ) : (
              <LightningIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
            )}
            <span>{reindexing ? 'Embedding…' : 'Reindex'}</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className={cn(
            // Sizing & Spacing
            "h-7 w-7 p-0"
          )}
          title="Refresh entries"
        >
          <ArrowClockwiseIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5",

              // Interactive & States
              loading ? "animate-spin" : ""
            )}
          />
        </Button>

        <Button
          size="sm"
          variant="default"
          onClick={handleOpenCreate}
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5",

            // Sizing & Spacing
            "h-7 px-2.5",

            // Typography
            "text-xs font-medium"
          )}
        >
          <PlusIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5"
            )}
          />
          <span>Add Note</span>
        </Button>
      </div>
    </div>
  );
}
