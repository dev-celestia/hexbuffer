import { Alert, AlertAction, AlertDescription, Button } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { useProxyStart } from '@/hooks/use-proxy-start';
import { useResponseOverridePage } from './hooks/use-response-override-page';
import { ResponseOverrideContent } from './components/response-override-content';

export function ApiOverridePage() {
  const page = useResponseOverridePage();
  const { proxyStatus, isStarting, handleStartProxy } = useProxyStart();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-1 flex-col min-h-0 overflow-hidden",

        // Sizing & Spacing
        "h-full p-2"
      )}
    >
      {proxyStatus !== 'connected' && (
        <div
          className={cn(
            // Sizing & Spacing
            "pb-2"
          )}
        >
          <Alert
            variant="default"
            className={cn(
              // Layout & Positioning
              "flex items-center shrink-0",

              // Backgrounds & Borders
              "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
            )}
          >
            <AlertDescription
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2",

                // Typography
                "text-amber-700 dark:text-amber-200/70"
              )}
            >
              <span>Start the proxy to intercept and override API responses.</span>
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="xs"
                onClick={handleStartProxy}
                disabled={isStarting || proxyStatus === 'starting'}
              >
                Start Proxy
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 flex-col min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-lg bg-background"
        )}
      >
        <ResponseOverrideContent page={page} />
      </div>
    </div>
  );
}

export const ResponseOverridePage = ApiOverridePage;
export default ApiOverridePage;
