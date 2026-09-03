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
} from '@phosphor-icons/react';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { HTTP_METHODS } from '../constants';
import type { MockDomain, MockRoute } from '../types';
import { useRouteEditor } from './hooks/use-routes-panel';
import { parseRouteParams } from '../../api-mock/lib/route-template';

const ALL_METHODS = ['ALL', ...HTTP_METHODS] as const;

const METHOD_COLORS: Record<string, string> = {
  ALL: 'text-purple-400 font-bold',
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
    saveBody,
    formatBody,
    handleClone,
    handleSendToRepeater,
  } = useRouteEditor(route, domains, onUpdate, onAdd);

  const [editingHeader, setEditingHeader] = useState(false);
  const [statusCodeStr, setStatusCodeStr] = useState(String(route.statusCode));
  const [editMethod, setEditMethod] = useState<string>(route.method);
  const [editPath, setEditPath] = useState(route.path);
  const dynamicParams = useMemo(() => parseRouteParams(route.path), [route.path]);

  const matchedDomain = domains.find((d) => d.id === route.domainId || d.hostname === route.domainId);
  const isFullUrl = route.path.startsWith('http://') || route.path.startsWith('https://');

  useEffect(() => {
    setStatusCodeStr(String(route.statusCode));
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
  }, [route.id, route.statusCode, route.method, route.path]);

  const handleSaveHeader = () => {
    const trimmed = editPath.trim();
    if (!trimmed) return;

    let finalPath = trimmed;
    let targetDomainId = route.domainId;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const u = new URL(trimmed);
        const host = u.hostname;
        const found = domains.find((d) => d.hostname.toLowerCase() === host.toLowerCase());
        if (found) {
          targetDomainId = found.id;
        }
      } catch {
        // Keep as is
      }
    } else {
      finalPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }

    onUpdate(route.id, {
      method: editMethod as MockRoute['method'],
      path: finalPath,
      domainId: targetDomainId,
    });
    setEditPath(finalPath);
    toast.success('Override target updated.');
    setEditingHeader(false);
  };

  const handleCancelHeader = () => {
    setEditMethod(route.method);
    setEditPath(route.path);
    setEditingHeader(false);
  };

  const displayMatchSummary = () => {
    if (isFullUrl) {
      return route.path;
    }
    const host = matchedDomain?.hostname || 'host';
    const proto = matchedDomain?.ssl ? 'https' : 'http';
    return `${proto}://${host}${route.path.startsWith('/') ? '' : '/'}${route.path}`;
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
      {/* Top Header: Target, Status & Action Toolbar */}
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
              onValueChange={(v) => { if (v) setEditMethod(v); }}
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
                {ALL_METHODS.map((m) => (
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
              placeholder="/path or https://api.example.com/path"
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
            <Button
              size="sm"
              onClick={handleSaveHeader}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelHeader}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2.5 p-2.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-mono",
                METHOD_COLORS[route.method] ?? ""
              )}
            >
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
              {displayMatchSummary()}
            </span>
            {dynamicParams.map((p) => (
              <Badge
                key={p}
                variant="secondary"
                className={cn(
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
                title="Clone override rule"
              >
                Clone
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => onDelete(route.id)}
                title="Delete override rule"
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
            "flex items-center justify-between",

            // Sizing & Spacing
            "mb-2"
          )}
        >
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
              Response Body
            </span>
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

            {dynamicParams.length > 0 && (
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-1 ml-2"
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
                      "cursor-pointer"
                    )}
                    title={`Click to copy {{${p}}} tag to clipboard`}
                  >
                    {`{{${p}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={formatBody}
            >
              <CodeIcon />
              Format JSON
            </Button>
            <Button
              size="sm"
              onClick={saveBody}
            >
              <FloppyDiskIcon />
              Save Response
            </Button>
          </div>
        </div>

        {/* Full-height Text Editor */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-hidden",

            // Backgrounds & Borders
            "rounded-md border border-border bg-code-bg"
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
      </div>
    </div>
  );
}

export const OverrideRuleEditor = RouteEditor;
