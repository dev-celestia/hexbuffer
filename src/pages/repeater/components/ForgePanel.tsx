import { Tabs, TabsList, TabsTrigger } from '@celestia-project/ui';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useForgePanel } from './forge-panel/use-forge-panel';
import { ForgeRequestBar } from './forge-panel/forge-request-bar';
import { ForgeRequestTabs } from './forge-panel/forge-request-tabs';
import { ForgeResponseView } from './forge-panel/forge-response-view';

function ForgeLoadingView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 border rounded-lg bg-background/50 p-6 min-h-[300px] transition-opacity duration-300 ease-out animate-in fade-in">
      <div className="relative flex items-center justify-center">
        {/* Outer pulse */}
        <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary/20" style={{ animationDuration: '1.2s' }} />
        {/* Inner spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" style={{ animationDuration: '0.6s' }} />
      </div>
      <div className="space-y-1.5 text-center">
        <h4 className="text-sm font-semibold text-foreground tracking-tight animate-pulse">
          Forging Request...
        </h4>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Executing script sandbox, establishing secure connection, and performing handshake...
        </p>
      </div>
    </div>
  );
}

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

  // Auto-switch to response when request completes
  // ponytail: automatically transition to response view when request completes
  useEffect(() => {
    if (!req.isLoading && (req.response || req.error)) {
      setActiveView('response');
    }
  }, [req.isLoading, req.response, req.error]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full space-y-2 p-2"
      )}
    >
      <ForgeRequestBar
        method={req.method}
        url={req.url}
        activeEndpoint={activeEndpoint}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
      />

      {/* Switch View Tabs */}
      {/* ponytail: show switcher if a response, error, or loading state exists */}
      {(req.response || req.error || req.isLoading) && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "pb-1"
          )}
        >
          <Tabs
            value={activeView}
            onValueChange={(val) => setActiveView(val as 'request' | 'response')}
            className={cn(
              // Sizing & Spacing
              "w-fit"
            )}
          >
            <TabsList>
              <TabsTrigger
                value="request"
              >
                Request
              </TabsTrigger>
              <TabsTrigger
                value="response"
                disabled={req.isLoading && !req.response && !req.error}
              >
                <span>Response</span>
                {req.response && (
                  <span
                    className={cn(
                      // Sizing & Spacing
                      "px-1 py-0.2",

                      // Typography
                      "text-[10px] font-bold",

                      // Backgrounds & Borders
                      "rounded",

                      // Interactive & States
                      "transition-colors",

                      req.response.status >= 200 && req.response.status < 300
                        ? "bg-emerald-500/10 text-emerald-500 font-bold"
                        : "bg-destructive/10 text-destructive font-bold"
                    )}
                  >
                    {req.response.status}
                  </span>
                )}
                {req.error && (
                  <span
                    className={cn(
                      // Sizing & Spacing
                      "px-1 py-0.2",

                      // Typography
                      "text-[10px] font-bold",

                      // Backgrounds & Borders
                      "bg-destructive/10 text-destructive rounded",

                      // Interactive & States
                      "transition-colors"
                    )}
                  >
                    Err
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0"
        )}
      >
        {req.isLoading ? (
          <ForgeLoadingView />
        ) : activeView === 'request' ? (
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
        )}
      </div>
    </div>
  );
}
