import { Button, ScrollArea, Tabs, TabsList, TabsTrigger, TextEditor } from '@celestia-project/ui';
import {
  CheckCircleIcon,
  XCircleIcon,
  CopyIcon,
  CheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useCollectionsStore, type ForgeResponse, type TestResult } from '@/stores/collections';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { FAILURE, SUCCESS } from '../../lib/status-styles';

interface ForgeResponseViewProps {
  isLoading: boolean;
  error: string | null;
  response: ForgeResponse | null;
  testResults: TestResult[];
  testScript: string;
  activeResTab: string;
  onResTabChange: (tab: string) => void;
  getFormattedBody: () => string;
  requestMethod: string;
  requestUrl: string;
  requestHeaders: { key: string; value: string; enabled: boolean }[];
  requestBody: string;
  requestBodyType: string;
}

const RESPONSE_TABS = ['pretty', 'raw', 'headers', 'request', 'testResults'] as const;

const TAB_LABELS: Record<(typeof RESPONSE_TABS)[number], string> = {
  pretty: 'Pretty',
  raw: 'Raw',
  headers: 'Headers',
  request: 'Request',
  testResults: 'Tests',
};

/** Placeholder shown when a tab has nothing to render. */
function EmptyTab({ message }: Readonly<{ message: string }>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full flex-col items-center justify-center',

        // Sizing & Spacing
        'gap-1 p-8',

        // Backgrounds & Borders
        'rounded-md border border-dashed'
      )}
    >
      <p
        className={cn(
          // Typography
          'text-xs text-muted-foreground'
        )}
      >
        {message}
      </p>
    </div>
  );
}

/** Label/value row used by the headers and sent-request tables. */
function DetailRow({
  label,
  value,
  muted = false,
}: Readonly<{ label: string; value: string; muted?: boolean }>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'grid grid-cols-[minmax(120px,240px)_minmax(0,1fr)]',

        // Sizing & Spacing
        'gap-3 px-2 py-1.5',

        // Backgrounds & Borders
        'rounded-sm odd:bg-muted/20'
      )}
    >
      <span
        className={cn(
          // Typography
          'truncate font-mono text-xs font-medium text-muted-foreground'
        )}
        title={label}
      >
        {label}
      </span>
      <span
        className={cn(
          // Typography
          'font-mono text-xs break-all',
          muted ? 'text-muted-foreground italic' : 'text-foreground'
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span
      className={cn(
        // Typography
        'text-3xs font-semibold tracking-wider text-muted-foreground/70 uppercase'
      )}
    >
      {children}
    </span>
  );
}

export function ForgeResponseView({
  error,
  response,
  testResults,
  testScript,
  activeResTab,
  onResTabChange,
  getFormattedBody,
  requestMethod,
  requestUrl,
  requestHeaders,
  requestBody,
  requestBodyType,
}: Readonly<ForgeResponseViewProps>) {
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  const { isCopied, copy } = useCopyToClipboard();
  const { theme } = useTheme();

  const handleCopy = () => {
    if (response?.body) {
      void copy(response.body, 'Response body copied to clipboard');
    }
  };

  const contexts = useCollectionsStore((s) => s.contexts) || [];

  const variables = useMemo(() => {
    if (!activeContextId) return {};
    const context = contexts.find((c) => c.id === activeContextId);
    if (!context) return {};
    try {
      const vars: Array<{ key: string; value: string }> = JSON.parse(context.variables);
      const map: Record<string, string> = {};
      vars.forEach((v) => {
        if (v.key) map[v.key.trim()] = v.value;
      });
      return map;
    } catch {
      return {};
    }
  }, [activeContextId, contexts]);

  const expandVars = (text: string) => {
    if (!text) return '';
    const str = typeof text === 'string' ? text : String(text);
    // ponytail: expand environment variables placeholder {{key}} with value from active context
    return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return trimmed in variables ? variables[trimmed] : `{{${key}}}`;
    });
  };

  const safeHeaders = requestHeaders || [];
  const safeBody = requestBody || '';
  const safeBodyType = requestBodyType || 'none';
  const safeRequestMethod = requestMethod || 'GET';
  const safeRequestUrl = requestUrl || '';
  const enabledHeaders = safeHeaders.filter((h) => h.enabled);

  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.length - passedCount;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex min-h-0 flex-1 flex-col',

        // Sizing & Spacing
        'gap-3'
      )}
    >
      {/* Execution failure banner */}
      {error && (
        <div
          className={cn(
            // Layout & Positioning
            'flex shrink-0 items-start',

            // Sizing & Spacing
            'gap-2 p-2.5',

            // Backgrounds & Borders
            'rounded-md border border-rose-500/30 bg-rose-500/10'
          )}
        >
          <XCircleIcon className={cn('mt-px size-4 shrink-0', FAILURE.text)} />
          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 flex-col',

              // Sizing & Spacing
              'gap-0.5'
            )}
          >
            <span
              className={cn(
                // Typography
                'text-xs font-semibold text-rose-600 dark:text-rose-400'
              )}
            >
              Request failed
            </span>
            <span
              className={cn(
                // Typography
                'font-mono text-xs break-all text-muted-foreground'
              )}
            >
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Tabs + copy action on one row */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between',

          // Sizing & Spacing
          'gap-3'
        )}
      >
        <Tabs
          value={activeResTab}
          onValueChange={onResTabChange}
          className={cn(
            // Layout & Positioning
            'min-w-0 flex-1'
          )}
        >
          <TabsList
            variant="line"
            className={cn(
              // Layout & Positioning
              'w-full justify-start'
            )}
          >
            {RESPONSE_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  // Sizing & Spacing
                  'flex-none px-3'
                )}
              >
                {TAB_LABELS[tab]}
                {tab === 'testResults' && failedCount > 0 && (
                  <span
                    className={cn(
                      // Layout & Positioning
                      'inline-flex items-center justify-center',

                      // Sizing & Spacing
                      'min-w-4 rounded-full px-1',

                      // Typography
                      'text-3xs leading-4 font-semibold tabular-nums',

                      // Backgrounds & Borders
                      'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {failedCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {response && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              // Sizing & Spacing
              'gap-1.5 px-2',

              // Typography
              'text-xs',

              // Interactive & States
              'text-muted-foreground hover:text-foreground'
            )}
            onClick={handleCopy}
            title="Copy response body"
          >
            {isCopied ? (
              <>
                <CheckIcon className={cn('size-3.5', SUCCESS.text)} />
                <span className={cn('font-medium', SUCCESS.text)}>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex min-h-0 flex-1 flex-col'
        )}
      >
        {activeResTab === 'pretty' && (
          <div
            className={cn(
              // Layout & Positioning
              'min-h-0 flex-1 overflow-hidden',

              // Backgrounds & Borders
              'rounded-md border'
            )}
          >
            {response ? (
              <TextEditor value={getFormattedBody()} options={{ readOnly: true }} theme={theme} />
            ) : (
              <EmptyTab message="No response body yet — send the request to see it here." />
            )}
          </div>
        )}

        {activeResTab === 'raw' && (
          <div
            className={cn(
              // Layout & Positioning
              'min-h-0 flex-1 overflow-hidden',

              // Backgrounds & Borders
              'rounded-md border'
            )}
          >
            {response ? (
              <TextEditor value={response.body} options={{ readOnly: true }} theme={theme} />
            ) : (
              <EmptyTab message="No response body yet — send the request to see it here." />
            )}
          </div>
        )}

        {activeResTab === 'headers' && (
          <ScrollArea className="h-full">
            {response && Object.keys(response.headers || {}).length > 0 ? (
              <div className="pr-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <DetailRow key={key} label={key} value={value} />
                ))}
              </div>
            ) : (
              <EmptyTab message="No response headers." />
            )}
          </ScrollArea>
        )}

        {activeResTab === 'request' && (
          <ScrollArea className="h-full">
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col',

                // Sizing & Spacing
                'gap-4 pr-2'
              )}
            >
              {/* Request line */}
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col',

                  // Sizing & Spacing
                  'gap-1.5'
                )}
              >
                <SectionLabel>Request line</SectionLabel>
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex items-baseline',

                    // Sizing & Spacing
                    'gap-2 rounded-md border bg-muted/30 px-2.5 py-2'
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      'font-mono text-xs font-bold text-primary'
                    )}
                  >
                    {safeRequestMethod}
                  </span>
                  <span
                    className={cn(
                      // Typography
                      'font-mono text-xs break-all text-foreground'
                    )}
                  >
                    {expandVars(safeRequestUrl)}
                  </span>
                </div>
              </div>

              {/* Headers */}
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col',

                  // Sizing & Spacing
                  'gap-1.5'
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex items-center justify-between',

                    // Sizing & Spacing
                    'gap-2'
                  )}
                >
                  <SectionLabel>Headers</SectionLabel>
                  <span
                    className={cn(
                      // Typography
                      'text-3xs tabular-nums text-muted-foreground'
                    )}
                  >
                    {enabledHeaders.length} sent
                  </span>
                </div>
                {enabledHeaders.length === 0 ? (
                  <p
                    className={cn(
                      // Typography
                      'px-2 text-xs text-muted-foreground italic'
                    )}
                  >
                    No headers sent with this request.
                  </p>
                ) : (
                  <div>
                    {enabledHeaders.map((header, index) => (
                      <DetailRow
                        key={index}
                        label={expandVars(header.key)}
                        value={expandVars(header.value)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              {safeBodyType !== 'none' && (
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex min-h-0 flex-col',

                    // Sizing & Spacing
                    'gap-1.5'
                  )}
                >
                  <SectionLabel>Body · {safeBodyType}</SectionLabel>
                  <div
                    className={cn(
                      // Layout & Positioning
                      'overflow-hidden',

                      // Sizing & Spacing
                      'min-h-[140px]',

                      // Backgrounds & Borders
                      'rounded-md border'
                    )}
                  >
                    <TextEditor
                      value={expandVars(safeBody)}
                      options={{ readOnly: true }}
                      theme={theme}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {activeResTab === 'testResults' && (
          <ScrollArea className="h-full">
            {testResults.length > 0 ? (
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col',

                  // Sizing & Spacing
                  'gap-3 pr-2'
                )}
              >
                {/* Summary */}
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex items-center',

                    // Sizing & Spacing
                    'gap-3 rounded-md border px-2.5 py-2',

                    // Typography
                    'text-xs'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircleIcon className={cn('size-3.5', SUCCESS.text)} />
                    <span className="font-semibold tabular-nums text-foreground">
                      {passedCount}
                    </span>
                    <span className="text-muted-foreground">passed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <XCircleIcon className={cn('size-3.5', FAILURE.text)} />
                    <span className="font-semibold tabular-nums text-foreground">
                      {failedCount}
                    </span>
                    <span className="text-muted-foreground">failed</span>
                  </span>
                </div>

                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      // Layout & Positioning
                      'flex items-start',

                      // Sizing & Spacing
                      'gap-2.5 rounded-md border p-2.5',

                      // Backgrounds & Borders
                      result.passed
                        ? 'border-emerald-500/25 bg-emerald-500/5'
                        : 'border-rose-500/25 bg-rose-500/5'
                    )}
                  >
                    {result.passed ? (
                      <CheckCircleIcon className={cn('mt-px size-4 shrink-0', SUCCESS.text)} />
                    ) : (
                      <XCircleIcon className={cn('mt-px size-4 shrink-0', FAILURE.text)} />
                    )}
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex min-w-0 flex-col',

                        // Sizing & Spacing
                        'gap-0.5'
                      )}
                    >
                      <span
                        className={cn(
                          // Typography
                          'text-xs font-medium text-foreground'
                        )}
                      >
                        {result.name}
                      </span>
                      {!result.passed && result.message && (
                        <span
                          className={cn(
                            // Typography
                            'font-mono text-2xs break-all text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {result.message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col items-center justify-center',

                  // Sizing & Spacing
                  'gap-2 p-8',

                  // Backgrounds & Borders
                  'rounded-md border border-dashed'
                )}
              >
                <WarningCircleIcon className="size-5 text-muted-foreground/40" />
                <p
                  className={cn(
                    // Sizing & Spacing
                    'max-w-sm',

                    // Typography
                    'text-center text-xs text-muted-foreground'
                  )}
                >
                  {testScript
                    ? 'The test script ran but registered no assertions. Call pm.test() to record one.'
                    : 'This request has no test script. Add assertions on the Scripts tab to check the response automatically.'}
                </p>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
