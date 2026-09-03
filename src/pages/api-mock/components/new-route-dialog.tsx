import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@celestia-project/ui';
import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { HTTP_METHODS } from '../constants';
import type { MockDomain, MockRoute } from '../types';
import {
  parseRouteParams,
  generateSamplePath,
  generateDynamicBodyTemplate,
} from '../lib/route-template';

interface NewRouteDialogProps {
  domains: MockDomain[];
  fixedDomainId?: string;
  dialogTitle?: string;
  buttonLabel?: string;
  onAdd: (route: Omit<MockRoute, 'id'>) => Promise<any> | void;
}

export function NewRouteDialog({
  domains: _domains,
  fixedDomainId = 'local_mock_server',
  dialogTitle = 'New Mock Endpoint',
  buttonLabel = 'New Endpoint',
  onAdd,
}: NewRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [method, setMethod] = useState<MockRoute['method']>('GET');
  const [path, setPath] = useState('/api/resource/:id');
  const [statusCode, setStatusCode] = useState('200');
  const [body, setBody] = useState(() => generateDynamicBodyTemplate(['id']));

  const effectiveDomainId = fixedDomainId || 'local_mock_server';
  const detectedParams = parseRouteParams(path);
  const samplePath = generateSamplePath(path);

  const handleAdd = async () => {
    if (!path.trim() || !effectiveDomainId || isSubmitting) return;
    const normalizedPath = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`;
    try {
      setIsSubmitting(true);
      await onAdd({
        domainId: effectiveDomainId,
        method,
        path: normalizedPath,
        statusCode: Number.parseInt(statusCode, 10) || 200,
        responseBody: body,
        responseHeaders: { 'Content-Type': 'application/json' },
        matchers: [],
        chaos: { latencyMode: 'none' },
        enabled: true,
        matcherEnabled: true,
      });
      setOpen(false);
    } catch {
      // Error handled by parent onAdd toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = () => {
    if (detectedParams.length > 0) {
      setBody(generateDynamicBodyTemplate(detectedParams));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            {buttonLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-5 pt-2"
          )}
        >
          {/* Method / Path / Status row */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-end",

              // Sizing & Spacing
              "gap-3"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "w-28 gap-1.5"
              )}
            >
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

            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col flex-1 min-w-0",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <Label className="text-xs text-muted-foreground">Path</Label>
              <Input
                placeholder="/api/resource/:id"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="h-9 font-mono text-sm bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "w-20 gap-1.5"
              )}
            >
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Input
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                className="h-9 text-center font-mono text-sm bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Dynamic Router Info */}
          {detectedParams.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "gap-3 p-3 rounded-md",

                // Backgrounds & Borders
                "bg-muted/30 border border-primary/20"
              )}
            >
              {/* Row 1: Parameters + action */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between",

                  // Sizing & Spacing
                  "gap-3"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center flex-wrap",

                    // Sizing & Spacing
                    "gap-1.5"
                  )}
                >
                  <span className="text-xs font-semibold text-foreground">
                    Dynamic Params
                  </span>
                  {detectedParams.map((p) => (
                    <Badge
                      key={p}
                      variant="secondary"
                      className="font-mono text-[10px] text-primary"
                    >
                      :{p}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyTemplate}
                  title="Generate response body with template strings"
                >
                  Use Template Body
                </Button>
              </div>

              {/* Row 2: Match hint */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center flex-wrap",

                  // Sizing & Spacing
                  "gap-x-2 gap-y-1"
                )}
              >
                <span className="text-[11px] text-muted-foreground">
                  Matches e.g.
                </span>
                <code
                  className={cn(
                    // Sizing & Spacing
                    "px-1.5 py-0.5 rounded",

                    // Typography
                    "font-mono text-[11px] font-semibold text-foreground",

                    // Backgrounds & Borders
                    "bg-muted/50"
                  )}
                >
                  {samplePath}
                </code>
              </div>

              {/* Row 3: Template tags */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center flex-wrap",

                  // Sizing & Spacing
                  "gap-1.5"
                )}
              >
                <span className="text-[11px] text-muted-foreground">Insert tag:</span>
                {detectedParams.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setBody((prev) =>
                        prev.includes(`{{${p}}}`)
                          ? prev
                          : prev.replace(/}/, `  "${p}": "{{${p}}}",\n}`)
                      );
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
                    title={`Insert {{${p}}} tag into template`}
                  >
                    {`{{${p}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Body */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between"
              )}
            >
              <Label className="text-xs text-muted-foreground">Response Body (JSON Template)</Label>
              {detectedParams.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Supports {`{{param}}`} or {`\${param}`}
                </span>
              )}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="font-mono text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1"
            />
          </div>

          {/* Submit */}
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-md cursor-pointer"
            onClick={handleAdd}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Endpoint'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const NewEndpointDialog = NewRouteDialog;
