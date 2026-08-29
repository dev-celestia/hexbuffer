import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@celestia-project/ui';
import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';

import { HTTP_METHODS, DEFAULT_RESPONSE_BODY } from '../constants';
import type { MockDomain, MockRoute } from '../types';

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
  const [domainId, setDomainId] = useState(fixedDomainId ?? domains[0]?.id ?? 'local_mock_server');
  const [method, setMethod] = useState<MockRoute['method']>('GET');
  const [path, setPath] = useState('/api/resource/:id');
  const [statusCode, setStatusCode] = useState('200');
  const [body, setBody] = useState(DEFAULT_RESPONSE_BODY);

  const isLocalMock = fixedDomainId === 'local_mock_server';
  const effectiveDomainId = fixedDomainId ?? domainId;

  const handleAdd = () => {
    if (!path.trim() || !effectiveDomainId) return;
    const normalizedPath = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`;
    onAdd({
      domainId: effectiveDomainId,
      method,
      path: normalizedPath,
      statusCode: parseInt(statusCode, 10) || 200,
      responseBody: body,
      responseHeaders: { 'Content-Type': 'application/json' },
      matchers: [],
      enabled: true,
      matcherEnabled: true,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="h-7 text-xs px-2.5 cursor-pointer">
          <PlusIcon className="mr-1 h-3 w-3 stroke-[2]" />
          {buttonLabel ?? (isLocalMock ? 'New Endpoint' : 'New Rule')}
        </Button>
      </DialogTrigger>
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
                <SelectTrigger className="h-9 bg-muted/40">
                  <SelectValue placeholder="Select host" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
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
              <Select value={method} onValueChange={(v) => setMethod(v as MockRoute['method'])}>
                <SelectTrigger className="h-9 bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Path</Label>
              <Input
                placeholder="/api/resource/:id"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="h-9 font-mono text-sm bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
            <div className="w-20 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Input
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                className="h-9 text-center font-mono text-sm bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
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

