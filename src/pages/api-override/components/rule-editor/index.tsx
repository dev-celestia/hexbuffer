import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import type { MockRoute } from '../../types';
import { useRouteEditor } from '../hooks/use-routes-panel';
import { parseRouteParams } from '../../../api-mock/lib/route-template';
import { EditorHeader } from './editor-header';
import { ResponsePanel } from './response-panel';
import type { RouteEditorProps } from './types';

export type { RouteEditorProps };

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
  const { body, setBody, saveBody, formatBody, handleClone, handleSendToRepeater } =
    useRouteEditor(route, domains, onUpdate, onAdd);

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
        if (found) targetDomainId = found.id;
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
    if (isFullUrl) return route.path;
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
      <EditorHeader
        route={route}
        editingHeader={editingHeader}
        editMethod={editMethod}
        editPath={editPath}
        dynamicParams={dynamicParams}
        displayMatchSummary={displayMatchSummary}
        onSetEditingHeader={setEditingHeader}
        onSetEditMethod={setEditMethod}
        onSetEditPath={setEditPath}
        onSaveHeader={handleSaveHeader}
        onCancelHeader={handleCancelHeader}
        onClone={handleClone}
        onSendToRepeater={handleSendToRepeater}
        onDelete={onDelete}
      />

      <ResponsePanel
        routeId={route.id}
        body={body}
        statusCodeStr={statusCodeStr}
        dynamicParams={dynamicParams}
        theme={theme}
        onBodyChange={setBody}
        onStatusCodeChange={setStatusCodeStr}
        onStatusCodeBlur={() => {
          const n = Number.parseInt(statusCodeStr, 10);
          const code = Number.isNaN(n) ? 200 : n;
          setStatusCodeStr(String(code));
          onUpdate(route.id, { statusCode: code });
        }}
        onFormatBody={formatBody}
        onSaveBody={saveBody}
      />
    </div>
  );
}

export const OverrideRuleEditor = RouteEditor;
