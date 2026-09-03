import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextEditor,
} from '@celestia-project/ui';
import { useState, useEffect, useMemo } from 'react';
import {
  TrashIcon,
  PencilSimpleIcon,
  ArrowSquareOutIcon,
  CodeIcon,
  FloppyDiskIcon,
  EyeIcon,
} from '@phosphor-icons/react';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { HTTP_METHODS } from '../constants';
import type { MockDomain, MockRoute } from '../types';
import { useRouteEditor } from './hooks/use-routes-panel';
import {
  parseRouteParams,
  generateSamplePath,
  renderTemplatePreview,
} from '../lib/route-template';

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
  isMockServer: _isMockServer = false,
  serverPort: _serverPort = 4000,
  onUpdate,
  onDelete,
  onAdd,
}: RouteEditorProps) {
  const { theme } = useTheme();
  const {
    body,
    setBody,
    saveBody,
    formatBody,
    handleClone,
    handleSendToRepeater,
  } = useRouteEditor(route, domains, onUpdate, onAdd);

  const [editingHeader, setEditingHeader] = useState(false);
  const [statusCodeStr, setStatusCodeStr] = useState(String(route.statusCode));
  const [editMethod, setEditMethod] = useState<MockRoute['method']>(route.method);
  const [editPath, setEditPath] = useState(route.path);

  // Dynamic Router Parsing & Live Preview
  const dynamicParams = useMemo(() => parseRouteParams(route.path), [route.path]);
  const [showPreview, setShowPreview] = useState(false);
  const [testPath, setTestPath] = useState(() => generateSamplePath(route.path));

  useEffect(() => {
    setStatusCodeStr(String(route.statusCode));
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
    setTestPath(generateSamplePath(route.path));
  }, [route.id, route.statusCode, route.method, route.path]);

  // Extract path params from testPath to simulate matching
  const testExtractedParams = useMemo(() => {
    const cleanPattern = route.path.split('?')[0].trim();
    const cleanReq = testPath.split('?')[0].trim();
    const rParts = cleanPattern.split('/').filter(Boolean);
    const pParts = cleanReq.split('/').filter(Boolean);

    if (rParts.length !== pParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < rParts.length; i++) {
      const r = rParts[i];
      const p = pParts[i];
      if (r.startsWith(':') && r.length > 1) {
        params[r.slice(1)] = p;
      } else if (r.startsWith('{') && r.endsWith('}') && r.length > 2) {
        params[r.slice(1, -1)] = p;
      } else if (r !== p && r !== '*') {
        return null;
      }
    }
    return params;
  }, [route.path, testPath]);

  // Rendered template preview output
  const renderedPreviewBody = useMemo(() => {
    if (!testExtractedParams) {
      return '// Request path does not match route pattern\n' + body;
    }
    return renderTemplatePreview(body, testExtractedParams, testPath, route.method);
  }, [body, testExtractedParams, testPath, route.method]);

  const handleSaveHeader = () => {
    const trimmedPath = editPath.trim();
    if (!trimmedPath) return;
    const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    onUpdate(route.id, { method: editMethod, path: normalizedPath });
    setEditPath(normalizedPath);
    toast.success('Endpoint updated.');
    setEditingHeader(false);
  };

  const handleCancelHeader = () => {
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Route Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Backgrounds & Borders
          "border-b bg-muted/10"
        )}
      >
        {editingHeader ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2 p-2.5"
            )}
          >
            <Select
              value={editMethod}
              onValueChange={(v) => {
                if (v) setEditMethod(v as MockRoute['method']);
              }}
            >
              <SelectTrigger
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-24",

                  // Typography
                  "text-xs font-mono font-semibold",

                  // Backgrounds & Borders
                  "bg-muted/40 border-border"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                    className={cn(
                      // Typography
                      "text-xs font-mono",
                      METHOD_COLORS[m] ?? ""
                    )}
                  >
                    {m}
                  </SelectItem>
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
              placeholder="/api/resource/:id"
              className={cn(
                // Sizing & Spacing
                "h-7 flex-1",

                // Typography
                "font-mono text-xs",

                // Backgrounds & Borders
                "bg-muted/40",

                // Interactive & States
                "focus-visible:ring-1 focus-visible:ring-primary"
              )}
              autoFocus
            />
            <Button size="sm" onClick={handleSaveHeader}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelHeader}>
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2 px-3 py-2"
            )}
          >
            {/* Method + Path + Dynamic badges */}
            <span className={`text-xs shrink-0 ${METHOD_COLORS[route.method] ?? ''}`}>
              {route.method}
            </span>
            <span
              className={cn(
                // Layout & Positioning
                "truncate",

                // Typography
                "font-mono text-xs font-medium text-foreground"
              )}
            >
              {route.path}
            </span>
            {dynamicParams.map((p) => (
              <Badge
                key={p}
                variant="secondary"
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Typography
                  "font-mono text-[10px] text-primary"
                )}
                title={`Dynamic route parameter :${p}. Use {{${p}}} in template.`}
              >
                :{p}
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingHeader(true)}
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-6 w-6 p-0",

                // Typography
                "text-muted-foreground hover:text-foreground",

                // Interactive & States
                "cursor-pointer"
              )}
              title="Edit method & path"
            >
              <PencilSimpleIcon
                className={cn(
                  // Sizing & Spacing
                  "h-3 w-3"
                )}
              />
            </Button>

            {/* Right-aligned actions */}
            <div
              className={cn(
                // Layout & Positioning
                "ml-auto flex items-center",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendToRepeater}
              >
                <ArrowSquareOutIcon />
                Repeater
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClone}
                title="Clone endpoint"
              >
                Clone
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => onDelete(route.id)}
                title="Delete endpoint"
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Response Panel */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0",

          // Sizing & Spacing
          "p-3"
        )}
      >
        {/* Response Controls Bar */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-3 mb-2"
          )}
        >
          {/* Left group: label + status + tags */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-bold uppercase tracking-wider text-foreground"
              )}
            >
              Response
            </span>

            {/* Status code input */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground font-mono"
                )}
              >
                Status:
              </span>
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
                className={cn(
                  // Sizing & Spacing
                  "h-6.5 w-16 px-1.5",

                  // Typography
                  "text-xs font-mono font-bold text-center",

                  // Backgrounds & Borders
                  "bg-muted/40"
                )}
                title="HTTP Status Code"
              />
            </div>
          </div>

          {/* Template Tag Chips — visually separated */}
          {dynamicParams.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 pl-2",

                // Backgrounds & Borders
                "border-l border-border"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground font-mono"
                )}
              >
                Tags:
              </span>
              {dynamicParams.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${p}}}`);
                    toast.success(`Copied {{${p}}} to clipboard`);
                  }}
                  className={cn(
                    // Sizing & Spacing
                    "px-1.5 py-0.5 rounded",

                    // Typography
                    "font-mono text-[10px] font-semibold text-primary",

                    // Backgrounds & Borders
                    "bg-primary/10 border border-primary/30 hover:bg-primary/20",

                    // Interactive & States
                    "cursor-pointer transition-colors"
                  )}
                  title={`Click to copy {{${p}}} tag to clipboard`}
                >
                  {`{{${p}}}`}
                </button>
              ))}
            </div>
          )}

          {/* Right group: actions */}
          <div
            className={cn(
              // Layout & Positioning
              "ml-auto flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            {dynamicParams.length > 0 && (
              <Button
                size="sm"
                variant={showPreview ? "secondary" : "outline"}
                onClick={() => setShowPreview((v) => !v)}
                title="Simulate incoming request and test template string rendering"
              >
                <EyeIcon />
                {showPreview ? "Hide Preview" : "Test Preview"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={formatBody}
            >
              <CodeIcon />
              Format
            </Button>
            <Button
              size="sm"
              onClick={saveBody}
            >
              <FloppyDiskIcon />
              Save
            </Button>
          </div>
        </div>

        {/* Live Simulation & Test Bar */}
        {showPreview && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-3 p-2.5 mb-2 rounded-md",

              // Backgrounds & Borders
              "bg-muted/30 border border-border"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Typography
                "font-mono text-[11px] text-muted-foreground"
              )}
            >
              Simulate:
            </span>
            <Input
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              placeholder="/api/resource/12"
              className={cn(
                // Sizing & Spacing
                "h-6.5 max-w-xs px-2",

                // Typography
                "font-mono text-xs",

                // Backgrounds & Borders
                "bg-muted/40"
              )}
            />
            <span
              className={cn(
                // Layout & Positioning
                "truncate",

                // Typography
                "text-[11px] font-mono"
              )}
            >
              {testExtractedParams ? (
                <span className="text-green-500 font-semibold">
                  ✓ {JSON.stringify(testExtractedParams)}
                </span>
              ) : (
                <span className="text-amber-500 font-semibold">
                  ⚠ No match
                </span>
              )}
            </span>
          </div>
        )}

        {/* Monaco / TextEditor Container */}
        {showPreview ? (
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2 flex-1 min-h-0",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            {/* Template String Editor */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0 overflow-hidden",

                // Backgrounds & Borders
                "border border-border rounded-md bg-code-bg"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "px-2.5 py-1",

                  // Backgrounds & Borders
                  "border-b border-border bg-muted/20",

                  // Typography
                  "text-[11px] font-mono text-muted-foreground"
                )}
              >
                <span>Template Editor</span>
                <span>Use {`{{param}}`}</span>
              </div>
              <div className="flex-1 min-h-0">
                <TextEditor
                  value={body}
                  onChange={(val) => setBody(val || '')}
                  language="json"
                  height="100%"
                  theme={theme}
                />
              </div>
            </div>

            {/* Live Rendered Output */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0 overflow-hidden",

                // Backgrounds & Borders
                "border border-border rounded-md bg-code-bg"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "px-2.5 py-1",

                  // Backgrounds & Borders
                  "border-b border-border bg-muted/20",

                  // Typography
                  "text-[11px] font-mono text-muted-foreground"
                )}
              >
                <span>Rendered Output ({testPath})</span>
                <span className="text-green-500 font-semibold">Live</span>
              </div>
              <div className="flex-1 min-h-0">
                <TextEditor
                  value={renderedPreviewBody}
                  onChange={() => {}}
                  language="json"
                  height="100%"
                  theme={theme}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 overflow-hidden",

              // Backgrounds & Borders
              "border border-border rounded-md bg-code-bg"
            )}
          >
            <TextEditor
              value={body}
              onChange={(val) => setBody(val || '')}
              language="json"
              height="100%"
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const EndpointEditor = RouteEditor;
