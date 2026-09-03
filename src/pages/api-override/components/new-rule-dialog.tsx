import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@celestia-project/ui';
import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';

import { HTTP_METHODS, DEFAULT_RESPONSE_BODY } from '../constants';
import type { MockDomain, MockRoute } from '../types';

const METHOD_OPTIONS = ['ALL', ...HTTP_METHODS] as const;

interface NewRouteDialogProps {
  domains: MockDomain[];
  fixedDomainId?: string;
  dialogTitle?: string;
  buttonLabel?: string;
  onAdd: (route: Omit<MockRoute, 'id'>) => void;
}

export function NewRouteDialog({
  domains,
  fixedDomainId,
  dialogTitle,
  buttonLabel,
  onAdd,
}: NewRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [domainId, setDomainId] = useState(fixedDomainId ?? domains[0]?.id ?? '');
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/api/resource/:id');
  const [statusCode, setStatusCode] = useState('200');
  const [body, setBody] = useState(DEFAULT_RESPONSE_BODY);

  const isLocalMock = fixedDomainId === 'local_mock_server';
  const effectiveDomainId = fixedDomainId ?? domainId;

  const handleAdd = () => {
    const trimmedPath = path.trim();
    if (!trimmedPath) return;

    let targetDomainId = effectiveDomainId;
    let normalizedPath = trimmedPath;

    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
      try {
        const u = new URL(trimmedPath);
        const host = u.hostname;
        const found = domains.find((d) => d.hostname.toLowerCase() === host.toLowerCase());
        if (found) {
          targetDomainId = found.id;
        } else if (!targetDomainId) {
          targetDomainId = host;
        }
      } catch {
        // Keep as is
      }
    } else {
      normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    }

    if (!targetDomainId && domains.length > 0) {
      targetDomainId = domains[0].id;
    }

    onAdd({
      domainId: targetDomainId || 'all-hosts',
      method: method as MockRoute['method'],
      path: normalizedPath,
      statusCode: parseInt(statusCode, 10) || 200,
      responseBody: body,
      responseHeaders: { 'Content-Type': 'application/json' },
      matchers: [],
      chaos: { latencyMode: 'none' },
      enabled: true,
      matcherEnabled: true,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            {buttonLabel ?? (isLocalMock ? 'New Endpoint' : 'New Rule')}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground">
            {dialogTitle ?? (isLocalMock ? 'New Local Mock Endpoint' : 'New Override Rule')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!fixedDomainId && domains.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target Host</Label>
              <Select value={domainId} onValueChange={(v) => setDomainId(v ?? '')}>
                <SelectTrigger className="h-9 bg-muted/40 font-mono text-xs">
                  <SelectValue placeholder="Select target host" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="font-mono text-xs">
                      {d.hostname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-28 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v ?? 'GET')}>
                <SelectTrigger className="h-9 bg-muted/40 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="font-mono text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Path or Full URL</Label>
              <Input
                placeholder="/api/resource/:id or https://api.example.com/..."
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="h-9 font-mono text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
            <div className="w-20 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Input
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                className="h-9 text-center font-mono text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Response Body (JSON)</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="font-mono text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
            />
          </div>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-md mt-2 cursor-pointer" onClick={handleAdd}>
            {isLocalMock ? 'Create Endpoint' : 'Create Override Rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const NewRuleDialog = NewRouteDialog;
