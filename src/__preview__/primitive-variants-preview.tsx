/**
 * TEMPORARY visual-verification harness for the new primitive variant props:
 *   Badge `mono`, Input `mono`, Textarea `mono`, ScrollArea `fill` + `mono`,
 *   TableCell `mono`, SelectTrigger `mono`, SelectItem `mono`,
 *   DialogTitle `mono`, DialogDescription `mono`, TooltipContent `mono`.
 *
 * Served by the normal dev server: http://localhost:1421/primitive-variants-preview.html
 *
 * Delete this file and `primitive-variants-preview.html` once signed off.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@celestia-project/ui';

class PreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[primitive-variants-preview] render failed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={{ margin: 0, padding: 24, font: '12px/1.5 ui-monospace, monospace', whiteSpace: 'pre-wrap', color: '#fca5a5', background: '#1c1917' }}>
          {'PREVIEW RENDER FAILED\n\n'}
          {String(this.state.error.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'success',
  'warning',
  'info',
  'outline',
  'ghost',
  'link',
] as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="text-foreground text-sm font-semibold">{title}</h2>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Preview() {
  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme="dark" defaultPrimaryColor="purple">
        <div className="bg-background text-foreground min-h-svh p-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-5">
            <h1 className="text-lg font-semibold">Primitive variant props</h1>

            <Section
              title="Badge — mono"
              hint="mono adds font-mono; every variant shown with and without it"
            >
              <div className="flex flex-col gap-3">
                {BADGE_VARIANTS.map((v) => (
                  <div key={v} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground w-24 shrink-0 text-xs">{v}</span>
                    <Badge variant={v}>GET /api/v1/users</Badge>
                    <Badge variant={v} mono>
                      0x9f8e7d6c5b4a39281706
                    </Badge>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Input — mono" hint="default vs mono; the mono one should align like a terminal">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="default input" />
                <Input mono placeholder="mono input" />
                <Input defaultValue="Content-Type: application/json" />
                <Input mono defaultValue="a3f1c9e0b47d2856" />
              </div>
            </Section>

            <Section title="Textarea — mono" hint="default vs mono">
              <div className="grid grid-cols-2 gap-3">
                <Textarea rows={4} placeholder="default textarea" />
                <Textarea
                  mono
                  rows={4}
                  defaultValue={'GET /api/v1/items HTTP/1.1\nHost: example.com\nAccept: */*'}
                />
              </div>
            </Section>

            <Section
              title="ScrollArea — fill"
              hint="both sit in a fixed-height flex column; only `fill` scrolls internally"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs">without fill</span>
                  <div className="border-border flex h-40 flex-col gap-2 overflow-hidden rounded-md border p-2">
                    <div className="text-xs">pinned header</div>
                    <ScrollArea className="border-border rounded border">
                      <div className="flex flex-col">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div key={i} className="border-border/50 border-b px-2 py-1 text-xs">
                            row {i + 1}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs">with fill</span>
                  <div className="border-border flex h-40 flex-col gap-2 overflow-hidden rounded-md border p-2">
                    <div className="text-xs">pinned header</div>
                    <ScrollArea fill className="border-border rounded border">
                      <div className="flex flex-col">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div key={i} className="border-border/50 border-b px-2 py-1 text-xs">
                            row {i + 1}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              title="TableCell — mono"
              hint="same table, mono only on the machine-readable columns"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Host</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Fingerprint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['api.example.com', '10.0.4.17', '9f8e7d6c5b4a3928'],
                    ['cdn.example.com', '10.0.4.22', '1a2b3c4d5e6f7081'],
                  ].map(([host, ip, fp]) => (
                    <TableRow key={ip}>
                      <TableCell mono>{host}</TableCell>
                      <TableCell mono>{ip}</TableCell>
                      <TableCell>{fp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>

            <Section
              title="SelectTrigger + SelectItem — mono"
              hint="method picker: mono on both the trigger and its items"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Select defaultValue="POST">
                  <SelectTrigger mono className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                      <SelectItem key={m} value={m} mono>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select defaultValue="POST">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section
              title="ScrollArea — mono"
              hint="mono on the container makes every log line monospace; no per-child font-mono"
            >
              <ScrollArea mono className="border-border h-32 rounded border">
                <div className="flex flex-col p-2">
                  {[
                    'GET /api/v1/users HTTP/1.1',
                    'Host: api.example.com',
                    'Accept: application/json',
                    'Authorization: Bearer eyJhbGciOi...',
                    '{"id":42,"name":"ada","active":true}',
                  ].map((line, i) => (
                    <div key={i} className="text-2xs whitespace-pre">
                      {line}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Section>

            <Section
              title="DialogTitle + DialogDescription — mono"
              hint="click to open; title and description render in the mono stack"
            >
              <Dialog>
                <DialogTrigger className="border-border w-fit rounded-md border px-3 py-1.5 text-xs">
                  Open dialog
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle mono>9f8e7d6c5b4a39281706</DialogTitle>
                    <DialogDescription mono>
                      sha256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </Section>

            <Section
              title="Type scale — sub-xs tokens"
              hint="each pair must resolve to an identical computed font-size"
            >
              <div className="flex flex-col gap-2">
                {(
                  [
                    ['text-[11px]', 'text-2xs'],
                    ['text-[10px]', 'text-3xs'],
                    ['text-[9px]', 'text-4xs'],
                  ] as const
                ).map(([arbitrary, token]) => (
                  <div key={token} className="flex items-center gap-4">
                    <code className="text-muted-foreground w-28 shrink-0 text-xs">{arbitrary}</code>
                    <span data-probe="arbitrary" className={arbitrary}>
                      0x9f8e7d6c
                    </span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <code className="text-muted-foreground w-24 shrink-0 text-xs">{token}</code>
                    <span data-probe="token" className={token}>
                      0x9f8e7d6c
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Redundant weight overrides"
              hint="font-medium is already the base weight on these — both cells must compute identically"
            >
              <div className="flex flex-col gap-3">
                {(
                  [
                    ['Button', <Button key="b">Save</Button>, <Button key="b2">Save</Button>],
                    ['Badge', <Badge key="g">alpha</Badge>, <Badge key="g2">alpha</Badge>],
                    ['Label', <Label key="l">Field</Label>, <Label key="l2">Field</Label>],
                    ['TabsTrigger', <Tabs key="t" value="a"><TabsList><TabsTrigger value="a">Tab</TabsTrigger></TabsList></Tabs>, <Tabs key="t2" value="a"><TabsList><TabsTrigger value="a">Tab</TabsTrigger></TabsList></Tabs>],
                  ] as const
                ).map(([name, bare, withOverride]) => (
                  <div key={name} className="flex items-center gap-4">
                    <span className="text-muted-foreground w-24 shrink-0 text-xs">{name}</span>
                    <span data-probe="bare">{bare}</span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <span data-probe="override">{withOverride}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="TooltipContent — mono" hint="hover the trigger">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="border-border w-fit rounded-md border px-3 py-1.5 text-xs">
                    Hover me
                  </TooltipTrigger>
                  <TooltipContent mono>0x9f8e7d6c5b4a39281706</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Section>
          </div>
        </div>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from primitive-variants-preview.html');
createRoot(container).render(<Preview />);