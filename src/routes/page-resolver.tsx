import React from "react";
import { StandaloneLayout } from "@/layout/standalone-layout";

// Lazy-loaded page components for standalone targets
const EncoderPage = React.lazy(() =>
  import("@/pages/encoder").then((m) => ({ default: m.EncoderPage }))
);
const JwtPage = React.lazy(() =>
  import("@/pages/jwt").then((m) => ({ default: m.JwtPage }))
);
const HashPage = React.lazy(() =>
  import("@/pages/hash").then((m) => ({ default: m.HashPage }))
);
const ComparerPage = React.lazy(() =>
  import("@/pages/comparer").then((m) => ({ default: m.ComparerPage }))
);
const RepeaterPage = React.lazy(() =>
  import("@/pages/repeater").then((m) => ({ default: m.RepeaterPage }))
);
const PortScannerPage = React.lazy(() =>
  import("@/pages/port-scanner").then((m) => ({ default: m.PortScannerPage }))
);
const SqlInjectionPage = React.lazy(() =>
  import("@/pages/sql-injection").then((m) => ({ default: m.SqlInjectionPage }))
);
const ScratchpadPage = React.lazy(() =>
  import("@/pages/notes").then((m) => ({ default: m.ScratchpadPage }))
);
const KanbanPage = React.lazy(() =>
  import("@/pages/kanban").then((m) => ({ default: m.KanbanPage }))
);
const TerminalPage = React.lazy(() =>
  import("@/pages/terminal").then((m) => ({ default: m.TerminalPage }))
);
const HttpHistoryPage = React.lazy(() =>
  import("@/pages/live-traffic/http-history").then((m) => ({ default: m.HttpHistoryPage }))
);
const IntruderPage = React.lazy(() =>
  import("@/pages/intruder").then((m) => ({ default: m.IntruderPage }))
);
const InterceptPage = React.lazy(() =>
  import("@/pages/intercept").then((m) => ({ default: m.InterceptPage }))
);

function StandaloneHttpHistoryPage() {
  React.useEffect(() => {
    let stopWatcher: (() => void) | undefined;
    import("@/triggers/live-traffic").then(({ startLiveTrafficWatcher, stopLiveTrafficWatcher }) => {
      startLiveTrafficWatcher();
      stopWatcher = stopLiveTrafficWatcher;
    });

    return () => {
      if (stopWatcher) stopWatcher();
    };
  }, []);

  return <HttpHistoryPage />;
}

function StandaloneRepeaterPage() {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const endpointId = params.get("endpointId");
      const raw = params.get("raw");
      const url = params.get("url");
      const name = params.get("name");

      if (endpointId) {
        import("@/stores/collections").then(({ useCollectionsStore }) => {
          useCollectionsStore.getState().fetchFromDb().then(() => {
            import("@/triggers/repeater/management").then(({ selectEndpoint }) => {
              selectEndpoint(endpointId);
            });
          });
        });
      } else if (raw || url) {
        import("@/triggers/repeater/send-to").then(({ sendRawToRepeater }) => {
          sendRawToRepeater({
            raw: raw || undefined,
            url: url || undefined,
            name: name || undefined,
          });
        });
      }
    }
  }, []);

  return <RepeaterPage />;
}

export function getAppTarget(): string | null {
  // 1. Check build-time environment variable
  const envTarget = import.meta.env.VITE_APP_TARGET;
  if (envTarget && envTarget !== "suite" && envTarget !== "main") {
    return envTarget.toLowerCase();
  }

  // 2. Check runtime query parameter (?target=encoder or ?standalone=jwt)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryTarget = params.get("target") || params.get("standalone");
    if (queryTarget && queryTarget !== "suite") {
      return queryTarget.toLowerCase();
    }
  }

  return null;
}

export function StandaloneAppView({ target }: { readonly target: string }) {
  const renderTargetPage = () => {
    switch (target) {
      case "http":
      case "http-history":
      case "live-traffic":
        return <StandaloneLayout id="/http-history" title="HTTP History"><StandaloneHttpHistoryPage /></StandaloneLayout>;
      case "encoder":
        return <StandaloneLayout id="/encoder" title="Encoder"><EncoderPage /></StandaloneLayout>;
      case "jwt":
        return <StandaloneLayout id="/jwt" title="JWT"><JwtPage /></StandaloneLayout>;
      case "hash":
        return <StandaloneLayout id="/hash" title="Hash"><HashPage /></StandaloneLayout>;
      case "comparer":
        return <StandaloneLayout id="/comparer" title="Comparer"><ComparerPage /></StandaloneLayout>;
      case "repeater":
        return <StandaloneLayout id="/repeater" title="Repeater"><StandaloneRepeaterPage /></StandaloneLayout>;
      case "port-scanner":
        return <StandaloneLayout id="/port-scanner" title="Port Scanner"><PortScannerPage /></StandaloneLayout>;
      case "intruder":
        return <StandaloneLayout id="/intruder" title="Intruder"><IntruderPage /></StandaloneLayout>;
      case "intercept":
        return <StandaloneLayout id="/intercept" title="Intercept"><InterceptPage /></StandaloneLayout>;
      case "sqli":
      case "sql-injection":
        return <StandaloneLayout id="/sql-injection" title="SQLi Helper"><SqlInjectionPage /></StandaloneLayout>;
      case "notes":
      case "scratchpad":
        return <StandaloneLayout id="/scratchpad" title="Hexbuffer Scratchpad"><ScratchpadPage /></StandaloneLayout>;
      case "kanban":
        return <StandaloneLayout id="/kanban" title="Hexbuffer Kanban"><KanbanPage /></StandaloneLayout>;
      case "terminal":
        return <StandaloneLayout id="/terminal" title="Hexbuffer Terminal"><TerminalPage /></StandaloneLayout>;
      default:
        return null;
    }
  };

  const page = renderTargetPage();
  if (!page) return null;

  return (
    <React.Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading tool…</div>}>
      {page}
    </React.Suspense>
  );
}
