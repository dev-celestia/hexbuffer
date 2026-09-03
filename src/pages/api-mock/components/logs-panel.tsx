import { Badge, Button, Input, ScrollArea, Separator, TextEditor } from '@celestia-project/ui';
import { ListIcon, ArrowSquareOutIcon, MagnifyingGlassIcon, LightningIcon, ArrowsLeftRightIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { useTheme } from '@/components/theme-provider';
import type { MockDomain, MockRoute, RequestLog } from '../types';
import { useLogsPanel, useLogDetail } from './hooks/use-logs-panel';

interface LogsProps {
  logs: RequestLog[];
  domains: MockDomain[];
  routes: MockRoute[];
  selectedLogId: string | null;
  onSelect: (id: string) => void;
}

function statusColor(code: number) {
  if (code < 300) return 'text-green-400';
  if (code < 400) return 'text-yellow-400';
  return 'text-red-400';
}

function methodColor(method: string) {
  const map: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-400 border-green-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PUT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    OPTIONS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return map[method] ?? 'bg-muted text-muted-foreground border-transparent';
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function LogsPanel({ logs, domains, routes, selectedLogId, onSelect }: LogsProps) {
  const { searchQuery, setSearchQuery, filteredLogs } = useLogsPanel(logs, domains);
  const selectedLog = logs.find((l) => l.id === selectedLogId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Left: log list */}
      <div className="flex w-[420px] shrink-0 flex-col border-r bg-background">
        <div className="flex flex-col gap-2 border-b p-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ListIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Mock API Logs</h3>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono rounded px-1.5 py-0.5 leading-none bg-muted text-muted-foreground">
              {filteredLogs.length} logs
            </Badge>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search logs by path, method, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7.5 h-7.5 text-xs bg-muted/30 focus-visible:ring-primary focus-visible:ring-1 border-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <ListIcon className="h-8 w-8 opacity-40" />
              <p className="text-sm font-medium">No requests logged yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20 border-b">
              {filteredLogs.map((log) => {
                const isSelected = selectedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40 ${
                      isSelected ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => onSelect(log.id)}
                  >
                    <span
                      className={`shrink-0 rounded-[3px] border px-1.5 py-0.5 text-[9px] font-bold leading-tight ${methodColor(log.method)}`}
                    >
                      {log.method}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium text-foreground">{log.path}</p>
                    </div>
                    <span className={`shrink-0 font-mono text-xs font-bold ${statusColor(log.statusCode)}`}>
                      {log.statusCode}
                    </span>
                    <span className="w-14 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                      {log.latencyMs}ms
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: log detail */}
      <div className="flex-1 min-w-0 bg-background">
        {selectedLog ? (
          <LogDetailView log={selectedLog} domains={domains} routes={routes} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-xs">Select a log entry to inspect request & response metadata</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogDetailView({ log, domains, routes }: { log: RequestLog; domains: MockDomain[]; routes: MockRoute[] }) {
  const { theme } = useTheme();
  const route = routes.find((r) => r.id === log.routeId);
  const { reqBodyStr, respBodyStr, handleSendToRepeater } = useLogDetail(log, domains, routes);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b p-3 bg-muted/10">
        <span className={`rounded-[3px] border px-2 py-0.5 text-xs font-bold ${methodColor(log.method)}`}>
          {log.method}
        </span>
        <span className="font-mono text-xs font-medium text-foreground">{log.path}</span>
        <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
          ⚡ Mock API
        </Badge>
        <span className={`font-mono text-xs font-bold ${statusColor(log.statusCode)}`}>
          HTTP {log.statusCode}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{log.latencyMs}ms</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(log.timestamp)}</span>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs ml-2 cursor-pointer border-border"
          onClick={handleSendToRepeater}
        >
          <ArrowSquareOutIcon className="mr-1 h-3.5 w-3.5" />
          To Repeater
        </Button>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-2 border-b p-3 bg-muted/5 text-xs">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Matched Endpoint</span>
          <span className="font-mono text-xs text-foreground mt-0.5 block truncate">
            {route ? `${route.method} ${route.path}` : 'Default Mock Response'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Latency</span>
          <span className="font-mono text-xs text-foreground mt-0.5 block truncate">
            {log.latencyMs} ms
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Timestamp</span>
          <span className="font-mono text-xs text-foreground mt-0.5 block">
            {new Date(log.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Editors: Request & Response */}
      <div className="flex flex-1 min-h-0 divide-x border-b">
        {/* Request */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Request Payload & Headers
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Headers ({Object.keys(log.requestHeaders).length})
                </span>
                <div className="rounded border border-border/60 bg-muted/20 p-2 font-mono text-[10px] space-y-0.5">
                  {Object.entries(log.requestHeaders).map(([k, v]) => (
                    <div key={k} className="flex">
                      <span className="text-muted-foreground shrink-0 w-36 truncate">{k}:</span>
                      <span className="text-foreground flex-1 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Body Payload
                </span>
                <div className="h-44 rounded border border-border overflow-hidden bg-code-bg">
                  <TextEditor
                    value={reqBodyStr}
                    onChange={() => {}}
                    language="json"
                    height="100%"
                    theme={theme}
                    options={{ readOnly: true }}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Response */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Mock Response Served
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Response Body
                </span>
                <div className="h-64 rounded border border-border overflow-hidden bg-code-bg">
                  <TextEditor
                    value={respBodyStr}
                    onChange={() => {}}
                    language="json"
                    height="100%"
                    theme={theme}
                    options={{ readOnly: true }}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
