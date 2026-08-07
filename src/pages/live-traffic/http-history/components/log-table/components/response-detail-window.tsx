import { Alert, AlertDescription, AlertTitle, Badge, Empty, EmptyDescription, EmptyTitle } from '@celestia-project/ui';
import { useResponseDetailWindow } from './hooks/use-response-detail-window';
import { InspectorSection } from '@/pages/live-traffic/components/inspector';
import { formatBytes } from '../utils';
import { cn } from '@/lib/utils';

interface ResponseDetailWindowProps {
  callId: string;
}

export function ResponseDetailWindow({ callId }: ResponseDetailWindowProps) {
  const {
    call,
    isLoading,
    error,
    statusVariant,
    responseHeaders,
    responseCookies,
    responseBodyItem,
  } = useResponseDetailWindow({ callId });

  if (isLoading) {
    return (
      <Empty>
        <EmptyTitle>Loading...</EmptyTitle>
      </Empty>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          // Sizing & Spacing
          "p-4"
        )}
      >
        <Alert variant="destructive">
          <AlertTitle>Failed to load response details</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!call) {
    return (
      <Empty>
        <EmptyTitle>Request not found</EmptyTitle>
        <EmptyDescription>The selected request could not be found.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "h-screen",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "h-10 px-3 py-2 gap-2",

          // Backgrounds & Borders
          "bg-muted border-b"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-sm font-medium"
            )}
          >
            Response
          </span>
          <span
            className={cn(
              // Layout & Positioning
              "truncate",

              // Typography
              "text-xs font-mono text-muted-foreground"
            )}
            title={call.url}
          >
            {call.method} {call.url}
          </span>
        </div>
        {call.response_status && (
          <Badge variant={statusVariant} className="text-xs">
            {call.response_status} {call.response_status_text}
          </Badge>
        )}
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-auto",

          // Sizing & Spacing
          "p-3"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "mb-2",

            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          {formatBytes(call.response_body_size)} received
        </div>
        <InspectorSection title="Headers" items={responseHeaders} defaultView="table" />
        {responseCookies.length > 0 && (
          <InspectorSection
            title="Cookies"
            items={responseCookies.map((cookie) => ({ name: cookie.name, value: cookie.value }))}
            defaultView="table"
          />
        )}
        <InspectorSection
          title="Body"
          items={responseBodyItem}
          defaultView="text"
        />
      </div>
    </div>
  );
}
