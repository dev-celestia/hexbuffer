import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@celestia-project/ui';
import { PlugsIcon } from '@phosphor-icons/react';
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
          {/*
            `Alert` lays itself out as a grid and puts its icon in column 1, spanning both rows. The
            old `flex items-center` replaced that grid outright — same `display` group, so
            tailwind-merge dropped the grid — leaving the text aligned only by accident. Nothing here
            overrides `display` now; the icon, title and description place themselves.
          */}
          <Alert
            className={cn(
              // Sizing & Spacing
              "px-3 py-2.5",

              // Backgrounds & Borders
              "border-warning/40 bg-warning/10 text-warning-foreground"
            )}
          >
            <PlugsIcon />
            <AlertTitle
              className={cn(
                // Typography
                "text-sm font-semibold"
              )}
            >
              Proxy is not running
            </AlertTitle>
            <AlertDescription
              className={cn(
                // Typography
                "text-warning-foreground/85"
              )}
            >
              Start the proxy to intercept and override API responses.
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
