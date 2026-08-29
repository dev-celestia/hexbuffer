import { Button, Checkbox, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tabs, TabsList, TabsTrigger, TextEditor } from '@celestia-project/ui';
import { useState, useEffect } from 'react';
import {
  TrashIcon,
  PencilSimpleIcon,
  ArrowSquareOutIcon,
  CopyIcon,
  CodeIcon,
  CheckIcon,
} from '@phosphor-icons/react';

import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { HTTP_METHODS } from '../constants';
import type { MockDomain, MockRoute } from '../types';
import { useRouteEditor } from './hooks/use-routes-panel';

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
  isMockServer?: boolean;
  serverPort?: number;
  onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  onDelete: (id: string) => void;
  onAdd: (route: Omit<MockRoute, 'id'>) => void;
}

export function RouteEditor({
  route,
  domains,
  isMockServer = false,
  serverPort = 4000,
  onUpdate,
  onDelete,
  onAdd,
}: RouteEditorProps) {
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
    handleCopyUrl,
    handleCopyCurl,
  } = useRouteEditor(route, domains, onUpdate, onAdd);

  const [editingHeader, setEditingHeader] = useState(false);
  const [statusCodeStr, setStatusCodeStr] = useState(String(route.statusCode));
  const [editMethod, setEditMethod] = useState<MockRoute['method']>(route.method);
  const [editPath, setEditPath] = useState(route.path);
  const [matcherEnabled, setMatcherEnabled] = useState(route.matcherEnabled ?? true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const domain = domains.find((d) => d.id === route.domainId);
  const baseUrl = isMockServer
    ? `http://127.0.0.1:${serverPort}`
    : domain
    ? `${domain.ssl ? 'https' : 'http'}://${domain.hostname}`
    : 'http://127.0.0.1:4000';

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
    toast.success('Override rule updated.');
    setEditingHeader(false);
  };

  const handleCancelHeader = () => {
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
  };

  const copyUrl = () => {
    handleCopyUrl(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return (
          <div className="space-y-3">
            {/* General Route Config */}
            <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {isMockServer ? 'Endpoint Settings' : 'Override Rule Config'}
              </h4>
              <div className="flex gap-4">
                <div className="space-y-1.5 w-24">
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
                    className="h-8 text-xs font-mono bg-muted/40 text-center"
                  />
                </div>

                {!isMockServer && (
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Target Hostname</Label>
                    <Select
                      value={route.domainId}
                      onValueChange={(v) => {
                        if (v) onUpdate(route.id, { domainId: v });
                      }}
                    >
                      <SelectTrigger className="text-xs h-8 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs font-mono">
                            {d.hostname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Chaos Latency / Errors */}
            <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Chaos Simulation (Latency & Errors)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Latency Mode</Label>
                  <Select
                    value={route.chaos?.latencyMode ?? 'none'}
                    onValueChange={(v) => {
                      if (v) onUpdate(route.id, { chaos: { ...route.chaos, latencyMode: v } });
                    }}
                  >
                    <SelectTrigger className="text-xs h-8 bg-muted/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (0 ms)</SelectItem>
                      <SelectItem value="fixed">Fixed Delay</SelectItem>
                      <SelectItem value="random">Random Jitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {route.chaos?.latencyMode === 'fixed' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Delay (ms)</Label>
                    <Input
                      type="number"
                      value={route.chaos?.latencyFixed ?? 500}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        onUpdate(route.id, {
                          chaos: {
                            latencyMode: route.chaos?.latencyMode ?? 'none',
                            ...route.chaos,
                            latencyFixed: val,
                          },
                        });
                      }}
                      className="h-8 text-xs font-mono bg-muted/40"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'matcher':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Request Matcher</h4>
                <p className="text-[10px] text-muted-foreground">
                  {matcherEnabled
                    ? 'Matches incoming requests by query params or payload'
                    : 'Matches on HTTP Method + Path only'}
                </p>
              </div>
              <Switch
                checked={matcherEnabled}
                onCheckedChange={(checked) => {
                  setMatcherEnabled(checked);
                  onUpdate(route.id, { matcherEnabled: checked });
                }}
              />
            </div>

            {matcherEnabled && (
              <div className="space-y-3">
                {/* Query Parameters Matcher */}
                <div className="rounded-md border border-border p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-foreground">Query Parameters</h5>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2 cursor-pointer" onClick={handleAddParam}>
                      + Add Param
                    </Button>
                  </div>
                  {queryParams.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No query parameter constraints</p>
                  ) : (
                    <div className="space-y-1.5">
                      {queryParams.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Checkbox checked={p.enabled} onCheckedChange={() => handleParamToggle(idx)} />
                          <Input
                            placeholder="Key"
                            value={p.key}
                            onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                            className="h-7 text-xs font-mono bg-muted/40 flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={p.value}
                            onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                            className="h-7 text-xs font-mono bg-muted/40 flex-1"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 cursor-pointer" onClick={() => handleRemoveParam(idx)}>
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expected Body Payload (Write Methods) */}
                {isWriteMethod && (
                  <div className="rounded-md border border-border p-3 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-foreground">Expected Request Body</h5>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2 cursor-pointer" onClick={formatReqBody}>
                          Format
                        </Button>
                        <Button size="sm" className="h-6 text-xs px-2 cursor-pointer" onClick={saveReqBody}>
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="h-40 rounded border border-border overflow-hidden bg-code-bg">
                      <TextEditor
                        value={reqBody}
                        onChange={(val) => setReqBody(val || '')}
                        language="json"
                        height="100%"
                        theme={theme}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'response':
        return (
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Response Body (JSON)</h4>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2.5 cursor-pointer" onClick={formatBody}>
                    Format JSON
                  </Button>
                  <Button size="sm" className="h-6 text-xs px-2.5 cursor-pointer" onClick={saveBody}>
                    Save Response
                  </Button>
                </div>
              </div>
              <div className="h-[360px] rounded border border-border overflow-hidden bg-code-bg mt-1">
                <TextEditor
                  value={body}
                  onChange={(val) => setBody(val || '')}
                  language="json"
                  height="100%"
                  theme={theme}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Route Header */}
      <div className="flex flex-col border-b bg-muted/10 shrink-0">
        {editingHeader ? (
          <div className="flex items-center gap-2 p-2.5">
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
            <Button size="sm" className="h-7 px-2.5 text-xs cursor-pointer" onClick={handleSaveHeader}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs cursor-pointer" onClick={handleCancelHeader}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5">
            <span className={`text-xs ${METHOD_COLORS[route.method] ?? ''}`}>{route.method}</span>
            <span className="font-mono text-xs font-medium text-foreground">{route.path}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingHeader(true)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Edit method & path"
            >
              <PencilSimpleIcon className="h-3 w-3" />
            </Button>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs font-mono font-semibold text-muted-foreground mr-1">HTTP {route.statusCode}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer border-border"
                onClick={copyUrl}
                title="Copy full URL"
              >
                {copiedUrl ? <CheckIcon className="mr-1 h-3 w-3 text-green-400" /> : <CopyIcon className="mr-1 h-3 w-3" />}
                URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer border-border"
                onClick={() => handleCopyCurl(baseUrl)}
                title="Copy cURL command"
              >
                <CodeIcon className="mr-1 h-3 w-3" />
                cURL
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs cursor-pointer border-border" onClick={handleSendToRepeater}>
                <ArrowSquareOutIcon className="mr-1 h-3.5 w-3.5" />
                Repeater
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs cursor-pointer border-border" onClick={handleClone} title="Clone override rule">
                Clone
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7 cursor-pointer rounded" onClick={() => onDelete(route.id)} title="Delete override rule">
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 bg-muted/5 border-b border-border/40">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'config' | 'matcher' | 'response')}>
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="matcher">Matcher</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 w-full">
          {renderTabContent()}
        </div>
      </ScrollArea>
    </div>
  );
}

export const OverrideRuleEditor = RouteEditor;

