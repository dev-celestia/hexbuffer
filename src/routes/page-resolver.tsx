import React from "react";
import { StandaloneLayout } from "@/layout/desktop-workspace/standalone-layout";

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
const MockApiPage = React.lazy(() =>
  import("@/pages/api-mock").then((m) => ({ default: m.MockApiPage }))
);
const ResponseOverridePage = React.lazy(() =>
  import("@/pages/api-override").then((m) => ({ default: m.ResponseOverridePage }))
);
const NucleiRunPage = React.lazy(() =>
  import("@/pages/nuclei-run").then((m) => ({ default: m.NucleiRunPage }))
);
const RegressionPage = React.lazy(() =>
  import("@/pages/regression").then((m) => ({ default: m.RegressionPage }))
);
const BrowserAutomationPage = React.lazy(() =>
  import("@/pages/browser").then((m) => ({ default: m.BrowserAutomationPage }))
);
const FileExplorerPage = React.lazy(() =>
  import("@/pages/file-explorer").then((m) => ({ default: m.FileExplorerPage }))
);
const SettingsPage = React.lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.Settings }))
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
        return <StandaloneLayout id="standalone-http" title="HTTP"><StandaloneHttpHistoryPage /></StandaloneLayout>;
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
        return <StandaloneLayout id="/scratchpad" title="Notes"><ScratchpadPage /></StandaloneLayout>;
      case "kanban":
        return <StandaloneLayout id="/kanban" title="Kanban"><KanbanPage /></StandaloneLayout>;
      case "terminal":
        return <StandaloneLayout id="/terminal" title="Terminal"><TerminalPage /></StandaloneLayout>;
      case "api-mock":
      case "mock-api":
      case "mock-forge":
        return <StandaloneLayout id="/api-mock" title="API Mock"><MockApiPage /></StandaloneLayout>;
      case "api-override":
      case "response-override":
        return <StandaloneLayout id="/api-override" title="API Override"><ResponseOverridePage /></StandaloneLayout>;
      case "nuclei":
      case "nuclei-run":
      case "scanner":
        return <StandaloneLayout id="/nuclei-run" title="Scanner"><NucleiRunPage /></StandaloneLayout>;
      case "regression":
        return <StandaloneLayout id="/regression" title="Regression"><RegressionPage /></StandaloneLayout>;
      case "browser":
        return <StandaloneLayout id="/browser" title="Browser Automation"><BrowserAutomationPage /></StandaloneLayout>;
      case "file-explorer":
        return <StandaloneLayout id="/file-explorer" title="File Explorer"><FileExplorerPage /></StandaloneLayout>;
      case "settings":
        return <StandaloneLayout id="/settings" title="Settings"><SettingsPage /></StandaloneLayout>;
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
