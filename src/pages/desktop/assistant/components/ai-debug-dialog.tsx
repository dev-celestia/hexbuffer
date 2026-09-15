import * as React from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@celestia-project/ui';
import { ArrowClockwiseIcon, CopyIcon, BugIcon } from '@phosphor-icons/react';
import { invoke } from '@tauri-apps/api/core';
import { cn } from '@/lib/utils';
import type { AiDebugSnapshot } from '../types';

interface AiDebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      <CopyIcon className="h-3.5 w-3.5" />
      {copied && (
        <span
          className={cn(
            // Layout & Positioning
            'absolute top-full inset-inline-start-1/2 -translate-x-1/2',
            // Sizing & Spacing
            'mt-1 px-1.5 py-0.5',
            // Typography
            'text-[10px] whitespace-nowrap',
            // Backgrounds & Borders
            'rounded bg-popover border border-border shadow-sm',
          )}
        >
          Copied!
        </span>
      )}
    </Button>
  );
}

function MonoBlock({ children, className }: { children: string; className?: string }) {
  return (
    <pre
      className={cn(
        // Layout & Positioning
        'overflow-x-auto',
        // Sizing & Spacing
        'p-3',
        // Typography
        'text-[11px] font-mono leading-relaxed',
        // Backgrounds & Borders
        'rounded-md bg-muted/60 border border-border/60',
        className,
      )}
    >
      {children}
    </pre>
  );
}

function SectionHeader({ label, copyText }: { label: string; copyText?: string }) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center justify-between',
        // Sizing & Spacing
        'mb-2',
      )}
    >
      <span
        className={cn(
          // Typography
          'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        )}
      >
        {label}
      </span>
      {copyText !== undefined && <CopyButton text={copyText} />}
    </div>
  );
}

export function AiDebugDialog({ open, onOpenChange }: AiDebugDialogProps) {
  const [snapshot, setSnapshot] = React.useState<AiDebugSnapshot | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSnapshot = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<AiDebugSnapshot>('get_ai_debug_snapshot');
      setSnapshot(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      void fetchSnapshot();
    }
  }, [open, fetchSnapshot]);

  const snapshotJson = snapshot ? JSON.stringify(snapshot, null, 2) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          'flex flex-col overflow-hidden',
          // Sizing & Spacing
          'w-full max-w-[calc(100%-2rem)] sm:max-w-3xl h-[85vh] max-h-[85vh]',
        )}
      >
        <DialogHeader>
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center justify-between',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-2',
              )}
            >
              <BugIcon className="h-4 w-4 text-muted-foreground" />
              <DialogTitle>AI Debug Inspector</DialogTitle>
              <Badge
                variant="secondary"
                className={cn(
                  // Sizing & Spacing
                  'h-4 px-1.5 py-0',
                  // Typography
                  'text-[9px] font-mono font-semibold uppercase tracking-wider',
                  // Backgrounds & Borders
                  'text-amber-500 bg-amber-500/10 border border-amber-500/20',
                )}
              >
                Alpha
              </Badge>
            </div>
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-1',
              )}
            >
              {snapshot && <CopyButton text={snapshotJson} />}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void fetchSnapshot()}
                disabled={loading}
                title="Refresh snapshot"
              >
                <ArrowClockwiseIcon
                  className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
          {snapshot && (
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-2 flex-wrap',
                // Sizing & Spacing
                'mt-1',
              )}
            >
              <Badge variant="outline">
                {snapshot.provider} / {snapshot.model}
              </Badge>
              {snapshot.lastRequestId && (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  req: {snapshot.lastRequestId}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(snapshot.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </DialogHeader>

        {error && (
          <p
            className={cn(
              // Sizing & Spacing
              'px-4 py-2',
              // Typography
              'text-xs text-destructive',
              // Backgrounds & Borders
              'rounded-md bg-destructive/10 border border-destructive/20',
            )}
          >
            {error}
          </p>
        )}

        {loading && !snapshot && (
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center justify-center',
              // Sizing & Spacing
              'py-12',
              // Typography
              'text-sm text-muted-foreground',
            )}
          >
            Loading snapshot…
          </div>
        )}

        {snapshot && (
          <Tabs defaultValue="system-prompt" className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList
              className={cn(
                // Layout & Positioning
                'flex-wrap shrink-0',
              )}
            >
              <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
              <TabsTrigger value="app-context">App Context</TabsTrigger>
              <TabsTrigger value="memory">
                Memory
                {snapshot.memoryEntries.length > 0 && (
                  <Badge variant="secondary" className="ms-1 text-[10px]">
                    {snapshot.memoryEntries.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages">
                Messages
                {snapshot.lastMessages.length > 0 && (
                  <Badge variant="secondary" className="ms-1 text-[10px]">
                    {snapshot.lastMessages.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tools">
                Tools
                <Badge variant="secondary" className="ms-1 text-[10px]">
                  {snapshot.tools.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* System Prompt */}
            <TabsContent
              value="system-prompt"
              className={cn(
                // Layout & Positioning
                'flex flex-col flex-1 min-h-0 overflow-hidden',
                // Sizing & Spacing
                'mt-3',
              )}
            >
              <ScrollArea
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',
                  // Sizing & Spacing
                  'w-full pe-3',
                )}
              >
                <SectionHeader label="PREAMBLE" copyText={snapshot.systemPrompt} />
                <MonoBlock>{snapshot.systemPrompt}</MonoBlock>
              </ScrollArea>
            </TabsContent>

            {/* App Context */}
            <TabsContent
              value="app-context"
              className={cn(
                // Layout & Positioning
                'flex flex-col flex-1 min-h-0 overflow-hidden',
                // Sizing & Spacing
                'mt-3',
              )}
            >
              <ScrollArea
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',
                  // Sizing & Spacing
                  'w-full pe-3',
                )}
              >
                {snapshot.appContextRaw ? (
                  <>
                    <SectionHeader label="RAW JSON" copyText={snapshot.appContextRaw} />
                    <MonoBlock>{snapshot.appContextRaw}</MonoBlock>
                  </>
                ) : (
                  <p
                    className={cn(
                      // Typography
                      'text-xs text-muted-foreground',
                    )}
                  >
                    No app context available yet. Send a message first.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Memory */}
            <TabsContent
              value="memory"
              className={cn(
                // Layout & Positioning
                'flex flex-col flex-1 min-h-0 overflow-hidden',
                // Sizing & Spacing
                'mt-3',
              )}
            >
              <ScrollArea
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',
                  // Sizing & Spacing
                  'w-full pe-3',
                )}
              >
                {snapshot.memoryEntries.length === 0 ? (
                  <p
                    className={cn(
                      // Typography
                      'text-xs text-muted-foreground',
                    )}
                  >
                    No memory entries were retrieved for the last prompt.
                  </p>
                ) : (
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex flex-col',
                      // Sizing & Spacing
                      'gap-3',
                    )}
                  >
                    {snapshot.memoryEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          // Sizing & Spacing
                          'p-3',
                          // Backgrounds & Borders
                          'rounded-md border border-border bg-muted/40',
                        )}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            'flex items-center gap-2',
                            // Sizing & Spacing
                            'mb-1',
                          )}
                        >
                          <span
                            className={cn(
                              // Typography
                              'text-xs font-semibold text-foreground',
                            )}
                          >
                            {entry.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {entry.sourceType}
                          </Badge>
                          {entry.pinned && (
                            <Badge variant="secondary" className="text-[10px]">
                              pinned
                            </Badge>
                          )}
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p
                          className={cn(
                            // Typography
                            'text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-words',
                          )}
                        >
                          {entry.content.slice(0, 600)}
                          {entry.content.length > 600 ? '…' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Messages */}
            <TabsContent
              value="messages"
              className={cn(
                // Layout & Positioning
                'flex flex-col flex-1 min-h-0 overflow-hidden',
                // Sizing & Spacing
                'mt-3',
              )}
            >
              <ScrollArea
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',
                  // Sizing & Spacing
                  'w-full pe-3',
                )}
              >
                {snapshot.lastPrompt && (
                  <div
                    className={cn(
                      // Sizing & Spacing
                      'mb-3 p-2',
                      // Typography
                      'text-xs',
                      // Backgrounds & Borders
                      'rounded-md bg-muted/40 border border-border',
                    )}
                  >
                    <span className="font-semibold text-muted-foreground">Last Prompt: </span>
                    <span className="text-foreground">{snapshot.lastPrompt}</span>
                  </div>
                )}
                {snapshot.lastMessages.length === 0 ? (
                  <p
                    className={cn(
                      // Typography
                      'text-xs text-muted-foreground',
                    )}
                  >
                    No messages captured yet. Send a chat message first.
                  </p>
                ) : (
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex flex-col',
                      // Sizing & Spacing
                      'gap-2',
                    )}
                  >
                    {snapshot.lastMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          // Sizing & Spacing
                          'p-2.5',
                          // Backgrounds & Borders
                          'rounded-md border',
                          msg.role === 'user'
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : msg.role === 'assistant'
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-border bg-muted/40',
                        )}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            'flex items-center justify-between',
                            // Sizing & Spacing
                            'mb-1',
                          )}
                        >
                          <Badge
                            variant={msg.role === 'user' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            [{idx}] {msg.role}
                          </Badge>
                          <CopyButton text={msg.content} />
                        </div>
                        <p
                          className={cn(
                            // Typography
                            'text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-words',
                          )}
                        >
                          {msg.content.slice(0, 1200)}
                          {msg.content.length > 1200 ? `\n…[${msg.content.length - 1200} more chars]` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Tools */}
            <TabsContent
              value="tools"
              className={cn(
                // Layout & Positioning
                'flex flex-col flex-1 min-h-0 overflow-hidden',
                // Sizing & Spacing
                'mt-3',
              )}
            >
              <ScrollArea
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',
                  // Sizing & Spacing
                  'w-full pe-3',
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex flex-col',
                    // Sizing & Spacing
                    'gap-2',
                  )}
                >
                  {snapshot.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className={cn(
                        // Layout & Positioning
                        'flex items-start gap-3',
                        // Sizing & Spacing
                        'p-2.5',
                        // Backgrounds & Borders
                        'rounded-md border border-border bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex flex-col flex-1 min-w-0',
                          // Sizing & Spacing
                          'gap-0.5',
                        )}
                      >
                        <span
                          className={cn(
                            // Typography
                            'text-xs font-mono font-semibold text-foreground',
                          )}
                        >
                          {tool.name}
                        </span>
                        <span
                          className={cn(
                            // Typography
                            'text-[11px] text-muted-foreground break-words',
                          )}
                        >
                          {tool.description}
                        </span>
                      </div>
                      <Badge
                        variant={tool.tier === 'auto_approved' ? 'secondary' : 'default'}
                        className="shrink-0 text-[10px]"
                      >
                        {tool.tier === 'auto_approved' ? 'auto' : 'confirm'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
