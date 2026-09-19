import { Tabs, TabsList, TabsTrigger } from '@celestia-project/ui';
import { useEffect, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, SpinnerIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getStatusTreatment, FAILURE } from '../lib/status-styles';
import { useForgePanel } from './forge-panel/use-forge-panel';
import { ForgeRequestBar } from './forge-panel/forge-request-bar';
import { ForgeRequestTabs } from './forge-panel/forge-request-tabs';
import { ForgeResponseView } from './forge-panel/forge-response-view';
import { ForgeResponseMeta } from './forge-panel/forge-response-meta';
import { ForgeLoadingView } from './forge-panel/forge-loading-view';

export function ForgePanel() {
  const {
    req,
    queryParams,
    activeReqTab,
    setActiveReqTab,
    activeResTab,
    setActiveResTab,
    activeEndpoint,
    handleQueryParamChange,
    handleQueryParamToggle,
    handleAddQueryParam,
    handleRemoveQueryParam,
    handleHeaderChange,
    handleHeaderToggle,
    handleAddHeader,
    handleRemoveHeader,
    handleMethodChange,
    handleUrlChange,
    handleBodyTypeChange,
    handleBodyChange,
    handlePreScriptChange,
    handleTestScriptChange,
    getFormattedBody,
  } = useForgePanel();

  const [activeView, setActiveView] = useState<'request' | 'response'>('request');

  // ponytail: automatically transition to response view when request completes
  useEffect(() => {
    if (!req.isLoading && (req.response || req.error)) {
      setActiveView('response');
    }
  }, [req.isLoading, req.response, req.error]);

  const statusTreatment = getStatusTreatment(req.response?.status);
  const hasFailed = Boolean(req.error) && !req.response;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex min-h-0 flex-col',

        // Sizing & Spacing
        'h-full gap-2 p-2'
      )}
    >
      <ForgeRequestBar
        method={req.method}
        url={req.url}
        activeEndpoint={activeEndpoint}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
      />

      {/* Mode switch — always visible so the layout does not jump when a response lands.
          The right side carries the live status readout in response mode. */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between gap-3',

          // Sizing & Spacing
          'pb-2',

          // Backgrounds & Borders
          'border-b'
        )}
      >
        <Tabs
          value={activeView}
          onValueChange={(val) => setActiveView(val as 'request' | 'response')}
          className={cn(
            // Sizing & Spacing
            'w-fit'
          )}
        >
          <TabsList>
            <TabsTrigger value="request">
              <ArrowUpIcon />
              Request
            </TabsTrigger>
            <TabsTrigger value="response">
              <ArrowDownIcon />
              Response
              {req.response && (
                <span
                  className={cn(
                    // Layout & Positioning
                    'inline-flex items-center',

                    // Sizing & Spacing
                    'rounded border px-1',

                    // Typography
                    'font-mono text-[10px] leading-4 font-semibold tabular-nums',

                    // Backgrounds & Borders
                    statusTreatment.pill
                  )}
                >
                  {req.response.status}
                </span>
              )}
              {hasFailed && (
                <span
                  className={cn(
                    // Layout & Positioning
                    'inline-flex items-center',

                    // Sizing & Spacing
                    'rounded border px-1',

                    // Typography
                    'font-mono text-[10px] leading-4 font-semibold',

                    // Backgrounds & Borders
                    FAILURE.pill
                  )}
                >
                  Failed
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          className={cn(
            // Layout & Positioning
            'flex min-w-0 items-center overflow-hidden',

            // Sizing & Spacing
            'gap-3'
          )}
        >
          {req.isLoading && (
            <span
              className={cn(
                // Layout & Positioning
                'flex items-center',

                // Sizing & Spacing
                'gap-1.5',

                // Typography
                'text-xs text-muted-foreground'
              )}
            >
              <SpinnerIcon className="size-3.5 animate-spin text-primary" />
              Sending
            </span>
          )}

          {!req.isLoading && activeView === 'response' && req.response && (
            <ForgeResponseMeta response={req.response} />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          // Layout & Positioning
          'flex min-h-0 flex-1 flex-col'
        )}
      >
        {activeView === 'response' ? (
          req.isLoading ? (
            <ForgeLoadingView />
          ) : (
            <ForgeResponseView
              isLoading={req.isLoading}
              error={req.error}
              response={req.response}
              testResults={req.testResults}
              testScript={req.testScript}
              activeResTab={activeResTab}
              onResTabChange={setActiveResTab}
              getFormattedBody={getFormattedBody}
              requestMethod={req.method}
              requestUrl={req.url}
              requestHeaders={req.headers}
              requestBody={req.body}
              requestBodyType={req.bodyType}
            />
          )
        ) : (
          <ForgeRequestTabs
            queryParams={queryParams}
            req={req}
            activeReqTab={activeReqTab}
            onReqTabChange={setActiveReqTab}
            onQueryParamChange={handleQueryParamChange}
            onQueryParamToggle={handleQueryParamToggle}
            onAddQueryParam={handleAddQueryParam}
            onRemoveQueryParam={handleRemoveQueryParam}
            onHeaderChange={handleHeaderChange}
            onHeaderToggle={handleHeaderToggle}
            onAddHeader={handleAddHeader}
            onRemoveHeader={handleRemoveHeader}
            onBodyTypeChange={handleBodyTypeChange}
            onBodyChange={handleBodyChange}
            onPreScriptChange={handlePreScriptChange}
            onTestScriptChange={handleTestScriptChange}
          />
        )}
      </div>
    </div>
  );
}
