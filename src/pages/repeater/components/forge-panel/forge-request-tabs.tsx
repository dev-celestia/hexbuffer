import { Button, ScrollArea, Switch, Tabs, TabsList, TabsTrigger, TextEditor } from '@celestia-project/ui';
import { useState, useRef } from 'react';

import { TrashIcon, UploadSimpleIcon, ImageSquareIcon } from '@phosphor-icons/react';
import type { KeyValuePair, ActiveRequestState } from '@/stores/collections';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { ForgeKeyValueEditor } from './forge-key-value-editor';

// ── Request tabs ──

interface ForgeRequestTabsProps {
  queryParams: KeyValuePair[];
  req: ActiveRequestState;
  activeReqTab: string;
  onReqTabChange: (tab: string) => void;
  onQueryParamChange: (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => void;
  onQueryParamToggle: (index: number) => void;
  onAddQueryParam: () => void;
  onRemoveQueryParam: (index: number) => void;
  onHeaderChange: (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => void;
  onHeaderToggle: (index: number) => void;
  onAddHeader: () => void;
  onRemoveHeader: (index: number) => void;
  onBodyTypeChange: (bodyType: string) => void;
  onBodyChange: (body: string, contentType?: string) => void;
  onPreScriptChange: (script: string) => void;
  onTestScriptChange: (script: string) => void;
}

const BODY_OPTIONS = ['none', 'raw', 'json'] as const;

const REQUEST_TABS = ['params', 'headers', 'body', 'scripts'] as const;

const TAB_LABELS: Record<(typeof REQUEST_TABS)[number], string> = {
  params: 'Params',
  headers: 'Headers',
  body: 'Body',
  scripts: 'Scripts',
};

/** Small count chip on a tab, e.g. how many headers are actually enabled. */
function TabCount({ value }: Readonly<{ value: number }>) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        // Layout & Positioning
        'inline-flex items-center justify-center',

        // Sizing & Spacing
        'min-w-4 rounded-full px-1',

        // Typography
        'text-[10px] leading-4 font-semibold tabular-nums',

        // Backgrounds & Borders
        'bg-muted text-muted-foreground'
      )}
    >
      {value}
    </span>
  );
}

export function ForgeRequestTabs({
  queryParams,
  req,
  activeReqTab,
  onReqTabChange,
  onQueryParamChange,
  onQueryParamToggle,
  onAddQueryParam,
  onRemoveQueryParam,
  onHeaderChange,
  onHeaderToggle,
  onAddHeader,
  onRemoveHeader,
  onBodyTypeChange,
  onBodyChange,
  onPreScriptChange,
  onTestScriptChange,
}: Readonly<ForgeRequestTabsProps>) {
  const { theme } = useTheme();
  const [activeScriptTab, setActiveScriptTab] = useState<'pre' | 'test'>('pre');
  const [isImageMode, setIsImageMode] = useState(() => {
    // ponytail: default to image mode if the body is already an image data URL
    return req.body.startsWith('data:image/');
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enabledParamCount = queryParams.filter((p) => p.enabled && p.key).length;
  const enabledHeaderCount = req.headers.filter((h) => h.enabled && h.key).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result) {
        onBodyChange(result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
          onBodyChange(result, file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileInfo = () => {
    if (!req.body.startsWith('data:image/')) return null;
    const match = req.body.match(/^data:([^;]+);base64,/);
    const mimeType = match ? match[1] : 'unknown';
    const base64Len = req.body.split(',')[1]?.length || 0;
    const sizeBytes = Math.round((base64Len * 3) / 4);
    const sizeKb = (sizeBytes / 1024).toFixed(1);
    return { mimeType, sizeKb };
  };

  const fileInfo = getFileInfo();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex min-h-0 flex-1 flex-col'
      )}
    >
      {/* Content tabs — an underline set, so they read as sub-navigation under the
          Request/Response mode switch rather than competing with it. */}
      <Tabs
        value={activeReqTab}
        onValueChange={onReqTabChange}
        className={cn(
          // Sizing & Spacing
          'w-full shrink-0'
        )}
      >
        <TabsList
          variant="line"
          className={cn(
            // Layout & Positioning
            'w-full justify-start'
          )}
        >
          {REQUEST_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                // Sizing & Spacing
                'flex-none px-3'
              )}
            >
              {TAB_LABELS[tab]}
              {tab === 'params' && <TabCount value={enabledParamCount} />}
              {tab === 'headers' && <TabCount value={enabledHeaderCount} />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div
        className={cn(
          // Layout & Positioning
          'flex min-h-0 flex-1 flex-col',

          // Sizing & Spacing
          'pt-3'
        )}
      >
        {/* ── Params tab ── */}
        {activeReqTab === 'params' && (
          <ScrollArea className="h-full">
            <ForgeKeyValueEditor
              items={queryParams}
              onItemChange={onQueryParamChange}
              onItemToggle={onQueryParamToggle}
              onAdd={onAddQueryParam}
              onRemove={onRemoveQueryParam}
              noun="Query parameters"
              emptyMessage="No query parameters. Add one to append it to the request URL."
            />
          </ScrollArea>
        )}

        {/* ── Headers tab ── */}
        {activeReqTab === 'headers' && (
          <ScrollArea className="h-full">
            <ForgeKeyValueEditor
              items={req.headers}
              onItemChange={onHeaderChange}
              onItemToggle={onHeaderToggle}
              onAdd={onAddHeader}
              onRemove={onRemoveHeader}
              noun="Headers"
              emptyMessage="No custom headers. Add one to send it with this request."
            />
          </ScrollArea>
        )}

        {/* ── Body tab ── */}
        {activeReqTab === 'body' && (
          <div
            className={cn(
              // Layout & Positioning
              'flex min-h-0 flex-1 flex-col',

              // Sizing & Spacing
              'gap-3'
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex shrink-0 items-center justify-between',

                // Sizing & Spacing
                'gap-3'
              )}
            >
              <Tabs
                value={req.bodyType}
                onValueChange={onBodyTypeChange}
                className={cn(
                  // Sizing & Spacing
                  'w-fit'
                )}
              >
                <TabsList>
                  {BODY_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option}
                      value={option}
                      className={cn(
                        // Sizing & Spacing
                        'flex-none px-3',

                        // Typography
                        'capitalize'
                      )}
                    >
                      {option}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {req.bodyType !== 'none' && (
                <label
                  className={cn(
                    // Layout & Positioning
                    'flex cursor-pointer items-center',

                    // Sizing & Spacing
                    'gap-2',

                    // Typography
                    'text-xs font-medium text-muted-foreground'
                  )}
                >
                  Image mode
                  <Switch checked={isImageMode} onCheckedChange={setIsImageMode} />
                </label>
              )}
            </div>

            <div
              className={cn(
                // Layout & Positioning
                'min-h-0 flex-1 overflow-hidden',

                // Backgrounds & Borders
                'rounded-md border'
              )}
            >
              {req.bodyType === 'none' ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex h-full flex-col items-center justify-center',

                    // Sizing & Spacing
                    'gap-1 p-8'
                  )}
                >
                  <p
                    className={cn(
                      // Typography
                      'text-xs font-medium text-foreground'
                    )}
                  >
                    No body
                  </p>
                  <p
                    className={cn(
                      // Sizing & Spacing
                      'max-w-xs',

                      // Typography
                      'text-center text-xs text-muted-foreground'
                    )}
                  >
                    This request sends no payload. Switch the format above to add one.
                  </p>
                </div>
              ) : isImageMode ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex h-full flex-col items-center justify-center',

                    // Sizing & Spacing
                    'p-6',

                    // Backgrounds & Borders
                    'bg-muted/5'
                  )}
                >
                  {req.body.startsWith('data:image/') ? (
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex w-full flex-col items-center',

                        // Sizing & Spacing
                        'max-w-md gap-4'
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex items-center justify-center',

                          // Sizing & Spacing
                          'max-h-60 p-2',

                          // Backgrounds & Borders
                          'overflow-hidden rounded-lg border bg-muted/20'
                        )}
                      >
                        <img
                          src={req.body}
                          alt="Request body preview"
                          className="max-h-56 rounded-md object-contain select-none"
                        />
                      </div>
                      {fileInfo && (
                        <p
                          className={cn(
                            // Typography
                            'font-mono text-xs text-muted-foreground'
                          )}
                        >
                          {fileInfo.mimeType} · {fileInfo.sizeKb} KB
                        </p>
                      )}
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex items-center',

                          // Sizing & Spacing
                          'gap-2'
                        )}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadSimpleIcon className="size-3.5" />
                          Replace image
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            // Sizing & Spacing
                            'h-7',

                            // Interactive & States
                            'text-destructive hover:bg-destructive/10 hover:text-destructive'
                          )}
                          onClick={() => onBodyChange('')}
                        >
                          <TrashIcon className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        // Layout & Positioning
                        'flex w-full flex-col items-center justify-center',

                        // Sizing & Spacing
                        'max-w-md gap-3 p-8',

                        // Backgrounds & Borders
                        'rounded-lg border-2 border-dashed',

                        // Interactive & States
                        'transition-colors',
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex items-center justify-center',

                          // Sizing & Spacing
                          'size-10',

                          // Backgrounds & Borders
                          'rounded-full bg-muted',

                          // Typography
                          'text-muted-foreground'
                        )}
                      >
                        <ImageSquareIcon className="size-5" />
                      </div>
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex flex-col items-center',

                          // Sizing & Spacing
                          'gap-1'
                        )}
                      >
                        <p
                          className={cn(
                            // Typography
                            'text-sm font-medium'
                          )}
                        >
                          Upload an image
                        </p>
                        <p
                          className={cn(
                            // Typography
                            'text-center text-xs text-muted-foreground'
                          )}
                        >
                          Drag a file here, or choose one below
                        </p>
                      </div>
                      <Button size="sm" className="h-7" onClick={() => fileInputRef.current?.click()}>
                        Choose file
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <TextEditor
                  value={req.body}
                  onChange={(val) => onBodyChange(val || '')}
                  theme={theme}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Scripts tab ── */}
        {activeReqTab === 'scripts' && (
          <div
            className={cn(
              // Layout & Positioning
              'flex min-h-0 flex-1 flex-col',

              // Sizing & Spacing
              'gap-3'
            )}
          >
            <Tabs
              value={activeScriptTab}
              onValueChange={(val) => setActiveScriptTab(val as 'pre' | 'test')}
              className={cn(
                // Sizing & Spacing
                'w-full shrink-0'
              )}
            >
              <TabsList
                variant="line"
                className={cn(
                  // Layout & Positioning
                  'w-full justify-start'
                )}
              >
                <TabsTrigger
                  value="pre"
                  className={cn(
                    // Sizing & Spacing
                    'flex-none px-3'
                  )}
                >
                  Pre-request
                </TabsTrigger>
                <TabsTrigger
                  value="test"
                  className={cn(
                    // Sizing & Spacing
                    'flex-none px-3'
                  )}
                >
                  Tests
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div
              className={cn(
                // Layout & Positioning
                'min-h-0 flex-1 overflow-hidden',

                // Backgrounds & Borders
                'rounded-md border'
              )}
            >
              {activeScriptTab === 'pre' ? (
                <TextEditor
                  value={req.preScript}
                  onChange={(val) => onPreScriptChange(val || '')}
                  theme={theme}
                />
              ) : (
                <TextEditor
                  value={req.testScript}
                  onChange={(val) => onTestScriptChange(val || '')}
                  theme={theme}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
