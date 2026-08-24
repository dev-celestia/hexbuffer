import { Button, Checkbox, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tabs, TabsList, TabsTrigger, TextEditor } from '@celestia-project/ui';
import { useState, useEffect } from 'react';
import {
  TrashIcon,
  PencilSimpleIcon,
  ArrowSquareOutIcon,
  FloppyDiskIcon,
  CopyIcon,
  CodeIcon,
} from '@phosphor-icons/react';

import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { HTTP_METHODS } from '../constants';
import type { MockDomain, MockRoute } from '../types';
import { useRouteEditor } from './hooks/use-routes-panel';
import { PlusIcon } from '@phosphor-icons/react';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500 font-bold',
  POST: 'text-blue-500 font-bold',
  PUT: 'text-yellow-500 font-bold',
  DELETE: 'text-red-500 font-bold',
  PATCH: 'text-orange-500 font-bold',
  OPTIONS: 'text-purple-500 font-bold',
};

interface RouteEditorProps {
  route: MockRoute;
  domains: MockDomain[];
  onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  onDelete: (id: string) => void;
  onAdd: (route: Omit<MockRoute, 'id'>) => void;
}

export function RouteEditor({ route, domains, onUpdate, onDelete, onAdd }: RouteEditorProps) {
  const { theme } = useTheme();
  const {
    body, setBody,
    reqBody, setReqBody,
    activeTab, setActiveTab,
    isWriteMethod,
    queryParams,
    saveBody,
    saveReqBody,
    formatBody,
    formatReqBody,
    handleClone,
    handleAddParam,
    handleRemoveParam,
    handleParamChange,
    handleParamToggle,
    handleSendToRepeater,
  } = useRouteEditor(route, domains, onUpdate, onAdd);

  const [editingHeader, setEditingHeader] = useState(false);
  const [statusCodeStr, setStatusCodeStr] = useState(String(route.statusCode));
  const [editMethod, setEditMethod] = useState<MockRoute['method']>(route.method);
  const [editPath, setEditPath] = useState(route.path);
  const [matcherEnabled, setMatcherEnabled] = useState(route.matcherEnabled ?? true);

  // Sync internal state when route changes
  useEffect(() => {
    setStatusCodeStr(String(route.statusCode));
    setEditMethod(route.method);
    setEditPath(route.path);
    setMatcherEnabled(route.matcherEnabled ?? true);
    setEditingHeader(false);
  }, [route.id, route.statusCode, route.method, route.path, route.matcherEnabled]);

  const handleSaveHeader = () => {
    const trimmedPath = editPath.trim();
    if (!trimmedPath) return;
    const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    onUpdate(route.id, { method: editMethod, path: normalizedPath });
    setEditPath(normalizedPath);
    toast.success('Route updated.');
    setEditingHeader(false);
  };

  const handleCancelHeader = () => {
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return (
          <div className="space-y-2">
            {/* General Route Config */}
            <div className="space-y-4 rounded-md border border-border p-2 bg-muted">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-1">Route Config</h4>
              <div className="flex gap-4">
                <div className="space-y-1.5 w-20">
                  <Label className="text-xs text-muted-foreground">Status Code</Label>
                  <Input
                    value={statusCodeStr}
                    onChange={(e) => setStatusCodeStr(e.target.value)}
                    onBlur={() => {
                      const n = Number.parseInt(statusCodeStr, 10);
                      const code = Number.isNaN(n) ? 200 : n;
                      setStatusCodeStr(String(code));
                      onUpdate(route.id, { statusCode: code });
                    }}
                    type="number"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Domain Hostname</Label>
                  <Select value={route.domainId} onValueChange={(v) => { if (v) onUpdate(route.id, { domainId: v }); }}>
                    <SelectTrigger className="text-xs w-full bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs font-mono">{d.hostname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );
      case 'matcher':
        return (
          <div className="space-y-2">
            {/* Matcher Enable/Disable */}
            <div className="flex items-center justify-between rounded-md border border-border p-2 bg-muted">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Request Matcher</h4>
                <p className="text-[10px] text-muted-foreground">
                  {matcherEnabled
                    ? 'Matches incoming requests by query params or body payload'
                    : 'Only matches by HTTP method + path (URL-level matching)'}
                </p>
              </div>
              <Switch
                checked={matcherEnabled}
                onCheckedChange={(v) => {
                  setMatcherEnabled(v);
                  onUpdate(route.id, { matcherEnabled: v });
                }}
              />
            </div>

            {/* Incoming Matcher Content */}
            {matcherEnabled && (
              <div className="space-y-4 rounded-md border border-border p-2 bg-muted">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Incoming Matcher</h4>
                  {isWriteMethod && (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-border cursor-pointer" onClick={formatReqBody}>
                        <CodeIcon className="mr-1 h-3 w-3" />
                        Prettier
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-primary-dark text-black font-semibold h-6 text-[10px] rounded cursor-pointer" onClick={saveReqBody}>
                        Save Matcher
                      </Button>
                    </div>
                  )}
                </div>

                {isWriteMethod ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expected Payload Body (JSON)</Label>
                    <div className="h-[180px] rounded border border-border overflow-hidden bg-code-bg">
                      <TextEditor value={reqBody} onChange={(val) => setReqBody(val || '')} language="json" height="100%" theme={theme} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Expected Query Parameters</Label>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-primary hover:bg-primary/10 rounded cursor-pointer" onClick={handleAddParam}>
                        <PlusIcon className="mr-1 h-3 w-3 stroke-[2]" /> Add Param
                      </Button>
                    </div>

                    {queryParams.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground font-mono bg-muted/10">
                        Matches any query string parameter ruleset
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {queryParams.map((param, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Checkbox
                              checked={param.enabled}
                              onCheckedChange={() => handleParamToggle(index)}
                              className="data-[state=checked]:bg-primary shrink-0"
                            />
                            <Input placeholder="Key" value={param.key} onChange={(e) => handleParamChange(index, 'key', e.target.value)} className="h-7.5 font-mono text-xs bg-muted/20 border-border" />
                            <Input placeholder="Value" value={param.value} onChange={(e) => handleParamChange(index, 'value', e.target.value)} className="h-7.5 font-mono text-xs bg-muted/20 border-border" />
                            <Button variant="ghost" size="icon" className="h-7.5 w-7.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0 rounded cursor-pointer" onClick={() => handleRemoveParam(index)}>
                              <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!matcherEnabled && (
              <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground font-mono bg-muted/10">
                Matcher disabled — route matches on <span className="text-foreground font-semibold">{route.method} {route.path}</span> only
              </div>
            )}
          </div>
        );
      case 'response':
      default:
        return (
          <div className="space-y-5">
            {/* Response Headers */}
            <div className="space-y-4 rounded-md border border-border p-2 bg-muted">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Response Headers</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Content-Type</span>
                  <span className="text-foreground">application/json</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">X-Powered-By</span>
                  <span className="text-foreground">MockForge Gateway</span>
                </div>
              </div>
            </div>

            {/* Response Body Editor */}
            <div className="space-y-4 rounded-md border border-border p-2 bg-muted flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Response Body</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border cursor-pointer" onClick={formatBody}>
                    <CodeIcon className="mr-1 h-3.5 w-3.5" />
                    Prettier JSON
                  </Button>
                  <Button size="sm" onClick={saveBody} className="h-7 text-xs cursor-pointer">
                    <FloppyDiskIcon className="mr-1 h-3.5 w-3.5" />
                    Save Response
                  </Button>
                </div>
              </div>
              <div className="h-[360px] rounded border border-border overflow-hidden bg-code-bg mt-2 flex-1">
                <TextEditor value={body} onChange={(val) => setBody(val || '')} language="json" height="100%" theme={theme} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Route header */}
      <div className="flex flex-col border-b bg-muted/10 shrink-0">
        {editingHeader ? (
          <div className="flex items-center gap-2 p-2">
            <Select value={editMethod} onValueChange={(v) => { if (v) setEditMethod(v as MockRoute['method']); }}>
              <SelectTrigger className="h-7 w-24 text-xs bg-muted/40 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={editPath}
              onChange={(e) => setEditPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveHeader();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelHeader();
                }
              }}
              className="h-7 flex-1 font-mono text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs cursor-pointer" onClick={handleSaveHeader}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs cursor-pointer" onClick={handleCancelHeader}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2">
            <span className={`text-xs ${METHOD_COLORS[route.method] ?? ''}`}>{route.method}</span>
            <span className="font-mono text-xs">{route.path}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingHeader(true)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Edit method & path"
            >
              <PencilSimpleIcon className="h-3 w-3" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">HTTP {route.statusCode}</span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs cursor-pointer border-border" onClick={handleSendToRepeater}>
                <ArrowSquareOutIcon className="mr-1 h-3.5 w-3.5" />
                To Repeater
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs cursor-pointer border-border" onClick={handleClone} title="Clone this route">
                <CopyIcon className="mr-1 h-3.5 w-3.5" />
                Clone
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7 cursor-pointer rounded" onClick={() => onDelete(route.id)} title="Delete route">
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-2 pt-2 bg-muted/5 border-b border-border/40">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'config' | 'matcher' | 'response')}>
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="matcher">Matcher</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 w-full">
          {renderTabContent()}
        </div>
      </ScrollArea>
    </div>
  );
}
